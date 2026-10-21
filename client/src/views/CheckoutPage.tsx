'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import {
  cartStore,
  discardCartAfterCheckout,
  dismissReservationExpiredNotice,
  fetchCart,
  refreshCartAfterCheckout,
  removeItem,
} from '@/features/cart'
import { authStore, fetchMe } from '@/features/auth'
import {
  canFetchShippingQuotes,
  canStartCheckout,
  cartFromFrozenQuoteSummary,
  checkoutPaymentPrefetchFingerprint,
  checkoutStore,
  completeBankTransferCheckout,
  awaitCheckoutTransitionPrefetch,
  getNextCheckoutStep,
  hasUsableCheckoutPaymentSession,
  initializeCheckoutNavigation,
  refreshCheckoutAfterCartChange,
  isCheckoutFormUnlocked,
  isFrozenQuoteCheckout,
  prepareCheckoutPayment,
  prefetchCheckoutPayment,
  resumeCheckoutForOrder,
  resumeFrozenQuoteCheckout,
  resetCheckout,
  setPaymentMethod,
  refreshTaxBreakdown,
  selectedShippingQuote,
  shouldSkipCheckoutStep,
  isPaymentRetryCheckout,
} from '@/features/checkout'
import type { CartDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { cn } from '@/utils/cn'
import { EmptyCartPrompt } from '@/components/cart/EmptyCartPrompt'
import {
  CheckoutOrderSummary,
  CheckoutSummaryHeader,
  checkoutTotalCents,
} from '@/components/checkout/stripe-ui/CheckoutOrderSummary'
import { CheckoutContactSection } from '@/components/checkout/stripe-ui/CheckoutContactSection'
import { CheckoutAddressesStep } from '@/components/checkout/stripe-ui/CheckoutAddressesStep'
import { CheckoutPaymentStep } from '@/components/checkout/stripe-ui/CheckoutPaymentStep'
import { CheckoutReviewStep } from '@/components/checkout/stripe-ui/CheckoutReviewStep'
import { CheckoutStepBody } from '@/components/checkout/stripe-ui/CheckoutStepBody'
import { CheckoutStepIndicator } from '@/components/checkout/stripe-ui/CheckoutStepIndicator'
import { StripeErrorBanner } from '@/components/checkout/stripe-ui/StripeFields'
import { LegacySiteNoticeInline } from '@/components/site/LegacySiteNoticeBanner'
import { CheckoutPaymentSkeleton } from '@/components/checkout/CheckoutPaymentSkeleton'
import { StripePaymentShell } from '@/components/checkout/StripePaymentShell'
import type { StripePaymentFormHandle } from '@/components/checkout/StripePaymentForm'
import { BankTransferAwaitingNote } from '@/components/checkout/BankTransferInstructions'
import {
  CheckoutLoadingOverlay,
  resolveCheckoutLoading,
  useStableCheckoutLoading,
} from '@/components/checkout/CheckoutLoadingOverlay'
import { CheckoutCartExpiredModal } from '@/components/checkout/CheckoutCartExpiredModal'
import { CheckoutSummarySkeleton } from '@/components/checkout/stripe-ui/CheckoutSummarySkeleton'
import {
  checkoutColumnGutterClass,
  checkoutFormColumnClass,
  checkoutFormContentClass,
  checkoutMainClass,
  checkoutShellClass,
} from '@/components/checkout/stripe-ui/constants'
import { useI18n } from '@/hooks/use-i18n'
import { ApiRequestError } from '@/types/api'
import { checkoutDbg } from '@/features/checkout/checkout-debug'

export function CheckoutPage() {
  const { t, tParams } = useI18n()
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  const cart = useSnapshot(cartStore)
  const checkout = useSnapshot(checkoutStore)
  const auth = useSnapshot(authStore)
  const stripeFormRef = useRef<StripePaymentFormHandle>(null)
  const [stripeReady, setStripeReady] = useState(false)
  const [stripeMount, setStripeMount] = useState<{
    clientSecret: string
    publishableKey?: string
    orderId: string
  } | null>(null)
  const checkoutPrepareKeyRef = useRef<string | null>(null)
  const checkoutPrepareBlockedRef = useRef(false)
  const [cartExpiredModalOpen, setCartExpiredModalOpen] = useState(false)

  const formUnlocked = isCheckoutFormUnlocked()
  const frozenCheckout = isFrozenQuoteCheckout()
  const paymentRetry = isPaymentRetryCheckout()
  const lockedCheckout = frozenCheckout || paymentRetry

  useEffect(() => {
    if (frozenCheckout || paymentRetry) return
    if (cart.reservationExpiredNotice || cart.cart?.reservation.expired) {
      setCartExpiredModalOpen(true)
    }
  }, [
    frozenCheckout,
    paymentRetry,
    cart.reservationExpiredNotice,
    cart.cart?.reservation.expired,
  ])

  const leaveCheckoutAfterCartExpired = useCallback(
    (path: '/cart' | '/negozio') => {
      dismissReservationExpiredNotice()
      setCartExpiredModalOpen(false)
      resetCheckout()
      void fetchCart({ force: true })
      navigate(path, { replace: true })
    },
    [navigate],
  )

  useEffect(() => {
    checkoutDbg.effect('normalizeLegacySteps', { step: checkoutStore.currentStep })
    if (checkoutStore.currentStep === 'billing' || checkoutStore.currentStep === 'shipping') {
      checkoutStore.currentStep = 'addresses'
    }
  }, [])

  // Evita overlay «Creazione account» / login bloccato se si esce dal checkout a metà.
  useEffect(() => {
    return () => {
      if (checkoutStore.initLoadingPhase) {
        checkoutStore.initLoadingPhase = null
      }
    }
  }, [])

  useEffect(() => {
    checkoutDbg.effect('checkoutInit', {
      retryOrder: searchParams.get('retryOrder'),
      frozenOrderId: searchParams.get('orderId'),
    })
    const retryOrderId = searchParams.get('retryOrder')
    const frozenOrderId = searchParams.get('orderId')
    const isResumeFlow = Boolean(frozenOrderId || retryOrderId)

    if (retryOrderId) {
      checkoutStore.paymentRetryActive = true
      checkoutStore.paymentRetryOrderId = retryOrderId
      checkoutStore.paymentRetryStep = searchParams.get('step') === 'review' ? 'review' : 'payment'
    }

    if (!isResumeFlow) {
      resetCheckout()
    }

    void (async () => {
      await fetchCart({ force: true })
      await fetchMe()
      if (frozenOrderId) {
        try {
          await resumeFrozenQuoteCheckout(frozenOrderId)
          return
        } catch {
          resetCheckout()
          navigate('/account/quotes')
          return
        }
      }
      if (retryOrderId) {
        try {
          await resumeCheckoutForOrder(retryOrderId)
          const retryMethod = searchParams.get('method')
          if (retryMethod === 'stripe' || retryMethod === 'bank_transfer') {
            setPaymentMethod(retryMethod)
          }
          return
        } catch (e) {
          const message = e instanceof Error ? e.message : t('checkout.error.generic')
          resetCheckout()
          checkoutStore.error = message
          return
        }
      }
    })()
  }, [searchParams])

  useEffect(() => {
    checkoutDbg.effect('authNavigation', {
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      hasMe: Boolean(auth.me),
      frozen: isFrozenQuoteCheckout(),
      paymentRetry: checkoutStore.paymentRetryActive,
      step: checkoutStore.currentStep,
      formUnlocked: isCheckoutFormUnlocked(),
    })
    if (isFrozenQuoteCheckout()) return
    if (checkoutStore.paymentRetryActive) {
      if (auth.isLoading) return
      if (!auth.isAuthenticated) {
        checkoutStore.currentStep = 'account'
        return
      }
      void (async () => {
        const retryOrderId = checkoutStore.paymentRetryOrderId
        if (!checkoutStore.order && retryOrderId) {
          try {
            await resumeCheckoutForOrder(retryOrderId)
          } catch (e) {
            checkoutStore.error = e instanceof Error ? e.message : t('checkout.error.generic')
            return
          }
        }
        if (checkoutStore.currentStep === 'account') {
          checkoutStore.currentStep = checkoutStore.paymentRetryStep
        }
      })()
      return
    }
    if (checkoutStore.initLoadingPhase || checkoutStore.addressPrefillLoading) return
    if (!auth.isLoading && auth.me) {
      void initializeCheckoutNavigation()
    }
    if (!auth.isLoading && !auth.isAuthenticated && !isCheckoutFormUnlocked()) {
      checkoutStore.currentStep = 'account'
    }
  }, [
    auth.isLoading,
    auth.isAuthenticated,
    auth.me,
    checkout.guestCheckoutAccepted,
    checkout.emailLookup.exists,
    checkout.contactForceLogin,
  ])

  // Macro-step: ospite resta su contatto; loggato → skip automatico allo step indirizzi.
  // Durante creazione account / login non avanzare: evita Indirizzo di spedizione dietro overlay.
  useEffect(() => {
    if (frozenCheckout || paymentRetry) return
    if (
      checkoutStore.initLoadingPhase === 'account' ||
      checkoutStore.initLoadingPhase === 'login'
    ) {
      return
    }
    if (!isCheckoutFormUnlocked()) {
      if (checkoutStore.currentStep !== 'account') {
        checkoutStore.currentStep = 'account'
      }
      return
    }
    if (
      auth.isAuthenticated &&
      shouldSkipCheckoutStep('account') &&
      (checkoutStore.currentStep === 'account' || checkoutStore.currentStep === 'customer_type')
    ) {
      const next = getNextCheckoutStep('account')
      if (next) checkoutStore.currentStep = next
    }
  }, [
    formUnlocked,
    frozenCheckout,
    paymentRetry,
    auth.isAuthenticated,
    checkout.initLoadingPhase,
    checkout.guestCheckoutAccepted,
    checkout.emailLookup.exists,
    checkout.draft.email,
    checkout.contactStepPinned,
  ])

  const c = cart.cart
  const summaryFromOrder =
    (frozenCheckout || paymentRetry) && checkout.frozenOrderSummary
      ? cartFromFrozenQuoteSummary({
          ...checkout.frozenOrderSummary,
          lines: [...checkout.frozenOrderSummary.lines],
        })
      : null
  const displayCart = summaryFromOrder && (frozenCheckout || !c || c.items.length === 0) ? summaryFromOrder : c
  const step = checkout.currentStep
  const shippingQuote = selectedShippingQuote()
  const canPay =
    canStartCheckout() &&
    !checkout.isLoading &&
    !checkout.isPaying &&
    !checkout.cartRefreshing
  const totalCents = displayCart
    ? checkoutTotalCents(displayCart, shippingQuote, checkout.taxBreakdown)
    : checkout.order?.amountTotal ?? 0

  const loadingState = useStableCheckoutLoading(
    resolveCheckoutLoading({
      step,
      isLoading: checkout.isLoading,
      isPaying: checkout.isPaying,
      cartRefreshing: checkout.cartRefreshing,
      initLoadingPhase: checkout.initLoadingPhase,
      addressPrefillLoading: checkout.addressPrefillLoading,
      shippingQuotesLoading: checkout.shippingQuotesLoading,
      cartLoading: cart.isLoading && !c,
    }),
  )

  // Tax API usa solo country (+ segment/VAT): non includere line1/civico o ogni keystroke
  // rilancia l'effect (log SKIP spam) mentre la destinazione è ancora incompleta.
  const shippingTaxCountry = checkout.draft.shipping.country.trim().toUpperCase()
  const billingTaxCountry = checkout.draft.billing.country.trim().toUpperCase()
  const taxDestinationReady = canFetchShippingQuotes()
  const taxEffectKey = [
    taxDestinationReady ? '1' : '0',
    shippingTaxCountry,
    billingTaxCountry,
  ].join('|')

  useEffect(() => {
    if (isFrozenQuoteCheckout()) return
    if (!isCheckoutFormUnlocked()) return
    if (checkout.addressPrefillLoading || checkout.initLoadingPhase) return
    checkoutDbg.effect('refreshTaxBreakdown', {
      step,
      vatValidated: checkout.business.vatValidated,
      taxEffectKey,
    })
    void refreshTaxBreakdown('CheckoutPage.useEffect:refreshTaxBreakdown')
  }, [
    formUnlocked,
    step,
    taxEffectKey,
    checkout.addressPrefillLoading,
    checkout.initLoadingPhase,
    checkout.business.vatValidated,
    checkout.business.vatForceAccepted,
    checkout.customerSegment,
  ])

  useEffect(() => {
    checkoutDbg.effect('clearStripeMountOnPaymentNull', { hasPayment: Boolean(checkout.payment) })
    if (!checkout.payment) {
      setStripeMount(null)
    }
  }, [checkout.payment])

  useEffect(() => {
    checkoutDbg.effect('syncStripeMount', {
      method: checkout.payment?.method,
      hasClientSecret: Boolean(checkout.payment?.clientSecret),
    })
    if (checkout.payment?.method === 'stripe' && checkout.payment.clientSecret) {
      setStripeMount((prev) => {
        const next = {
          clientSecret: checkout.payment!.clientSecret!,
          publishableKey: checkout.payment!.publishableKey ?? undefined,
          orderId: checkout.payment!.orderId,
        }
        if (
          prev?.clientSecret === next.clientSecret &&
          prev?.publishableKey === next.publishableKey &&
          prev?.orderId === next.orderId
        ) {
          return prev
        }
        return next
      })
    } else if (checkout.payment?.method !== 'stripe') {
      setStripeMount(null)
    }
  }, [checkout.payment])

  useEffect(() => {
    checkoutDbg.effect('resetPrepareRefsOnPaymentMethodChange', {
      method: checkout.selectedPaymentMethod,
    })
    checkoutPrepareBlockedRef.current = false
    checkoutPrepareKeyRef.current = null
  }, [checkout.selectedPaymentMethod])

  // Prefetch Stripe solo quando cambiano importo/spedizione/metodo/ordine — non a ogni keystroke.
  useEffect(() => {
    if (isFrozenQuoteCheckout()) return
    if (!isCheckoutFormUnlocked()) return
    if (!checkout.shippingSelectionPersisted) return
    prefetchCheckoutPayment('CheckoutPage.useEffect:prefetchCheckoutPayment')
  }, [
    formUnlocked,
    checkout.selectedShippingMethodRef,
    checkout.shippingSelectionPersisted,
    checkout.shippingSelectingRef,
    checkout.selectedPaymentMethod,
    checkout.cartRefreshing,
    checkout.order?.orderId,
    checkout.order?.amountTotal,
    checkout.order?.currencyCode,
    checkout.payment?.clientSecret,
    checkout.payment?.amount,
    checkout.payment?.orderId,
  ])

  useEffect(() => {
    const guards = {
      formUnlocked: isCheckoutFormUnlocked(),
      method: checkout.selectedPaymentMethod,
      canStart: canStartCheckout(),
      isLoading: checkout.isLoading,
      isPaying: checkout.isPaying,
      cartRefreshing: checkout.cartRefreshing,
      shippingSelecting: checkout.shippingSelectingRef,
      shippingPersisted: checkout.shippingSelectionPersisted,
      hasPayment: Boolean(checkout.payment),
      hasOrder: Boolean(checkout.order),
    }
    checkoutDbg.effect('prepareStripeSession', guards)

    if (!isCheckoutFormUnlocked()) return
    if (checkout.selectedPaymentMethod !== 'stripe') return
    if (
      !canStartCheckout() ||
      checkout.isLoading ||
      checkout.isPaying ||
      checkout.cartRefreshing ||
      checkout.shippingSelectingRef ||
      !checkout.shippingSelectionPersisted
    ) {
      checkoutDbg.fn('prepareStripeSession', 'skip', { reason: 'guards failed', guards })
      return
    }
    if (hasUsableCheckoutPaymentSession()) {
      checkoutDbg.fn('prepareStripeSession', 'skip', { reason: 'payment already exists' })
      return
    }

    const prepareKey = checkoutPaymentPrefetchFingerprint()

    if (checkoutPrepareBlockedRef.current && checkoutPrepareKeyRef.current === prepareKey) {
      checkoutDbg.fn('prepareStripeSession', 'skip', { reason: 'blocked after error', prepareKey })
      return
    }

    checkoutDbg.fn('prepareStripeSession', 'enter', { prepareKey })
    void (async () => {
      checkoutPrepareKeyRef.current = prepareKey
      try {
        // Una sola pipeline con prefetch transition/payment (dedupe start + createSession).
        await awaitCheckoutTransitionPrefetch()
        await prepareCheckoutPayment({
          silent: true,
          via: 'CheckoutPage.useEffect:prepareStripeSession',
        })
        checkoutPrepareBlockedRef.current = false
        checkoutDbg.fn('prepareStripeSession', 'exit', {
          orderId: checkoutStore.order?.orderId,
          hasClientSecret: Boolean(checkoutStore.payment?.clientSecret),
        })
      } catch (e) {
        checkoutPrepareBlockedRef.current = true
        if (
          e instanceof ApiRequestError &&
          (e.code === 'EMPTY_CART' || e.code === 'CART_NOT_FOUND')
        ) {
          cartStore.reservationExpiredNotice = true
          setCartExpiredModalOpen(true)
          void fetchCart({ force: true })
        }
        checkoutDbg.fn('prepareStripeSession', 'error', {
          message: e instanceof Error ? e.message : String(e),
        })
      }
    })()
  }, [
    formUnlocked,
    checkout.selectedShippingMethodRef,
    checkout.shippingSelectionPersisted,
    checkout.shippingSelectingRef,
    checkout.selectedPaymentMethod,
    checkout.isLoading,
    checkout.isPaying,
    checkout.cartRefreshing,
    checkout.order?.orderId,
    checkout.order?.amountTotal,
    checkout.order?.currencyCode,
    checkout.payment?.clientSecret,
    checkout.payment?.amount,
    checkout.payment?.orderId,
  ])

  async function handlePay() {
    if (checkoutStore.cartRefreshing) return
    checkoutStore.error = null
    checkoutStore.isPaying = true
    try {
      if (checkout.selectedPaymentMethod === 'bank_transfer') {
        const orderId = await completeBankTransferCheckout()
        await refreshCartAfterCheckout()
        navigate(`/checkout/result/${orderId}`, { replace: true })
        return
      }
      await prepareCheckoutPayment()
      if (!checkoutStore.payment?.clientSecret) {
        checkoutStore.error = t('checkout.payment.formNotReady')
        return
      }
      const form = stripeFormRef.current
      if (!form?.ready) {
        checkoutStore.error = stripeMount
          ? t('checkout.payment.cardIncomplete')
          : t('checkout.payment.formNotReady')
        return
      }
      await form.pay()
    } catch (e) {
      if (
        e instanceof ApiRequestError &&
        (e.code === 'EMPTY_CART' || e.code === 'CART_NOT_FOUND')
      ) {
        cartStore.reservationExpiredNotice = true
        setCartExpiredModalOpen(true)
        void fetchCart({ force: true })
        return
      }
      checkoutStore.error =
        e instanceof ApiRequestError
          ? (e.userMessage ?? e.message)
          : e instanceof Error
            ? e.message
            : t('checkout.error.generic')
    } finally {
      checkoutStore.isPaying = false
    }
  }

  function handleStripePaymentSuccess(paidOrderId: string) {
    discardCartAfterCheckout()
    navigate(`/checkout/result/${paidOrderId}`, { replace: true })
  }

  const isCartUnresolved = !frozenCheckout && !paymentRetry && !c
  const isCartEmpty = !frozenCheckout && !paymentRetry && c != null && c.items.length === 0

  if (cartExpiredModalOpen) {
    return (
      <div className="checkout-root min-h-screen bg-idl-tech-panel">
        <CheckoutCartExpiredModal
          open
          onBackToCart={() => leaveCheckoutAfterCartExpired('/cart')}
          onBrowseCatalog={() => leaveCheckoutAfterCartExpired('/negozio')}
        />
      </div>
    )
  }

  if (isCartEmpty && !cart.isLoading) {
    return (
      <div className="checkout-root flex min-h-screen flex-col items-center justify-center bg-idl-tech-panel px-4 py-12">
        <LegacySiteNoticeInline className="w-full max-w-md" />
        <EmptyCartPrompt compact className="w-full max-w-md" />
      </div>
    )
  }

  const payLabel =
    checkout.isLoading || checkout.isPaying
      ? t('checkout.processing')
      : checkout.selectedPaymentMethod === 'bank_transfer'
        ? t('checkout.confirmOrder')
        : tParams('checkout.payAmount', {
            amount: formatMoney(totalCents, displayCart?.currencyCode ?? checkout.order?.currencyCode ?? 'EUR'),
          })

  async function handleRemoveFromCheckout(itemId: string) {
    await removeItem(itemId, { silent: true })
    await refreshCheckoutAfterCartChange()
  }

  const activeStripeSession =
    stripeMount ??
    (checkout.payment?.method === 'stripe' && checkout.payment.clientSecret
      ? {
          clientSecret: checkout.payment.clientSecret,
          publishableKey: checkout.payment.publishableKey,
          orderId: checkout.payment.orderId,
        }
      : null)

  const paymentDetailsReady = canStartCheckout() || lockedCheckout
  const isContactStep = step === 'account' || step === 'customer_type'
  const isAddressesStep =
    step === 'addresses' ||
    step === 'billing' ||
    step === 'shipping' ||
    step === 'details' ||
    step === 'delivery_recipient' ||
    step === 'shipping_method'
  // Non montare form indirizzi dietro overlay auth/prefill (via vuota editabile a torto).
  // Solo initLoadingPhase: addressPrefillLoading da solo può essere geocode puntuale già in form.
  const authInitHidesAddresses =
    checkout.initLoadingPhase === 'account' ||
    checkout.initLoadingPhase === 'login' ||
    checkout.initLoadingPhase === 'anagrafica' ||
    checkout.initLoadingPhase === 'indirizzi' ||
    checkout.initLoadingPhase === 'spedizioni'
  const isPaymentStep = step === 'payment' || step === 'payment_method' || step === 'review'
  const showPaymentStep = lockedCheckout || isPaymentStep

  const stripeCardDetails = activeStripeSession ? (
    <StripePaymentShell
      clientSecret={activeStripeSession.clientSecret}
      publishableKey={activeStripeSession.publishableKey}
      orderId={activeStripeSession.orderId}
      formRef={stripeFormRef}
      onReadyChange={setStripeReady}
      onBeforeConfirm={prepareCheckoutPayment}
      onPaymentSuccess={handleStripePaymentSuccess}
      onError={(msg) => {
        checkoutStore.error = msg?.trim() ? msg : null
      }}
    />
  ) : (formUnlocked || lockedCheckout) && checkout.selectedPaymentMethod === 'stripe' ? (
    <CheckoutPaymentSkeleton />
  ) : null

  return (
    <div className={checkoutShellClass}>
      {displayCart ? (
        <>
          <CheckoutOrderSummary
            cart={displayCart}
            selectedShipping={shippingQuote}
            freeShippingHint={checkout.freeShippingHint}
            taxBreakdown={checkout.taxBreakdown}
            mobileOnly
            revealGrandTotal={formUnlocked || lockedCheckout}
            onRemoveItem={frozenCheckout ? undefined : (id) => void handleRemoveFromCheckout(id)}
            removeDisabled={cart.isLoading || checkout.cartRefreshing || frozenCheckout}
          />
          <CheckoutOrderSummary
            cart={displayCart}
            selectedShipping={shippingQuote}
            freeShippingHint={checkout.freeShippingHint}
            taxBreakdown={checkout.taxBreakdown}
            revealGrandTotal={formUnlocked || lockedCheckout}
            onRemoveItem={frozenCheckout ? undefined : (id) => void handleRemoveFromCheckout(id)}
            removeDisabled={cart.isLoading || checkout.cartRefreshing || frozenCheckout}
          />
        </>
      ) : isCartUnresolved || cart.isLoading ? (
        <CheckoutSummarySkeleton />
      ) : null}

      <main className={checkoutMainClass}>
        {loadingState?.visible ? (
          <CheckoutLoadingOverlay
            icon={loadingState.icon}
            messageKey={loadingState.messageKey}
            scope={loadingState.scope}
            blockInteraction={loadingState.blockInteraction}
          />
        ) : null}
        <div
          className={cn(
            checkoutFormColumnClass,
            'w-full border-b border-white/10 bg-[#0c0c0d] py-3 sm:py-3.5 lg:hidden',
            checkoutColumnGutterClass,
          )}
        >
          <CheckoutSummaryHeader theme="dark" />
        </div>

        <div className={checkoutFormContentClass}>
          {frozenCheckout ? (
            <p className="mb-4 rounded-xl border border-[#0c0c0d]/30 bg-[#f4f5f7] px-4 py-3 text-sm text-[#3a3a3d]">
              {t('cart.quote.frozenNotice')}
            </p>
          ) : null}

          {/* Fuori dallo step pagamento: toast globale. Sul pagamento → sopra «Metodo di pagamento». */}
          {!showPaymentStep ? <StripeErrorBanner message={checkout.error} /> : null}

          <LegacySiteNoticeInline />

          {!lockedCheckout ? <CheckoutStepIndicator currentStep={step} /> : null}

          <div className="space-y-8">
            {!lockedCheckout && isContactStep ? (
              <CheckoutStepBody>
                <CheckoutContactSection />
              </CheckoutStepBody>
            ) : null}

            {!lockedCheckout && isAddressesStep && !authInitHidesAddresses ? (
              <CheckoutStepBody>
                <CheckoutAddressesStep disabled={!formUnlocked} />
              </CheckoutStepBody>
            ) : null}

            {showPaymentStep ? (
              <CheckoutStepBody>
                <CheckoutPaymentStep
                  embedded
                  disabled={!formUnlocked && !lockedCheckout}
                  stripeCardDetails={stripeCardDetails}
                  stripeFormReady={stripeReady}
                  stripeSessionReady={Boolean(activeStripeSession)}
                />
                {checkout.selectedPaymentMethod === 'bank_transfer' && paymentDetailsReady ? (
                  <section className="mt-6 rounded-xl border border-idl-tech-border bg-idl-tech-panel p-4">
                    <BankTransferAwaitingNote />
                  </section>
                ) : null}
                {displayCart ? (
                  <div className="mt-6">
                    <CheckoutReviewStep
                      embedded
                      showBack={!lockedCheckout}
                      cart={displayCart as CartDTO}
                      onConfirmPay={() => void handlePay()}
                      payLabel={payLabel}
                      canPay={
                        canPay &&
                        (checkout.selectedPaymentMethod !== 'stripe' ||
                          Boolean(activeStripeSession?.clientSecret && stripeReady))
                      }
                    />
                  </div>
                ) : null}
              </CheckoutStepBody>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
