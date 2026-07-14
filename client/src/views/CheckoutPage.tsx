'use client'

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from '@/lib/navigation'
import { CheckoutLegalLinks } from '@/components/checkout/stripe-ui/CheckoutLegalLinks'
import { useSnapshot } from 'valtio/react'
import { cartStore, fetchCart, fetchRecommendations, removeItem } from '@/features/cart'
import { authStore, fetchMe } from '@/features/auth'
import {
  canAdvanceFromStep,
  canStartCheckout,
  cartFromFrozenQuoteSummary,
  checkoutStore,
  completeBankTransferCheckout,
  createPaymentSession,
  initializeCheckoutNavigation,
  refreshCheckoutAfterCartChange,
  isFrozenQuoteCheckout,
  prepareCheckoutPayment,
  prefetchCheckoutPayment,
  prefetchCheckoutTransitionToPayment,
  resumeCheckoutForOrder,
  resumeFrozenQuoteCheckout,
  resetCheckout,
  setPaymentMethod,
  refreshTaxBreakdown,
  selectedShippingQuote,
  startCheckout,
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
import { CheckoutRegistrationStep } from '@/components/checkout/stripe-ui/CheckoutRegistrationStep'
import { CheckoutCustomerTypeStep } from '@/components/checkout/stripe-ui/CheckoutCustomerTypeStep'
import { CheckoutAddressesStep } from '@/components/checkout/stripe-ui/CheckoutAddressesStep'
import { CheckoutDeliveryRecipientStep } from '@/components/checkout/stripe-ui/CheckoutDeliveryRecipientStep'
import { CheckoutShippingMethodStep } from '@/components/checkout/stripe-ui/CheckoutShippingMethodStep'
import { CheckoutPaymentStep } from '@/components/checkout/stripe-ui/CheckoutPaymentStep'
import { CheckoutReviewStep } from '@/components/checkout/stripe-ui/CheckoutReviewStep'
import { CheckoutStepIndicator } from '@/components/checkout/stripe-ui/CheckoutStepIndicator'
import { CheckoutStepBody } from '@/components/checkout/stripe-ui/CheckoutStepBody'
import { StripeErrorBanner } from '@/components/checkout/stripe-ui/StripeFields'
import { CheckoutPaymentSkeleton } from '@/components/checkout/CheckoutPaymentSkeleton'
import { StripePaymentShell } from '@/components/checkout/StripePaymentShell'
import type { StripePaymentFormHandle } from '@/components/checkout/StripePaymentForm'
import { BankTransferAwaitingNote } from '@/components/checkout/BankTransferInstructions'
import {
  CheckoutLoadingOverlay,
  resolveCheckoutLoading,
  useStableCheckoutLoading,
} from '@/components/checkout/CheckoutLoadingOverlay'
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
import { preloadStripe, preloadStripeCheckoutModule } from '@/lib/stripe-loader'
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

  useEffect(() => {
    checkoutDbg.effect('normalizeLegacySteps', { step: checkoutStore.currentStep })
    if (checkoutStore.currentStep === 'billing' || checkoutStore.currentStep === 'shipping') {
      checkoutStore.currentStep = 'addresses'
    }
  }, [])

  useEffect(() => {
    checkoutDbg.effect('checkoutInit', {
      retryOrder: searchParams.get('retryOrder'),
      frozenOrderId: searchParams.get('orderId'),
    })
    preloadStripe()
    preloadStripeCheckoutModule()
    const retryOrderId = searchParams.get('retryOrder')
    const frozenOrderId = searchParams.get('orderId')
    const isResumeFlow = Boolean(frozenOrderId || retryOrderId)

    // Reset subito (non dopo fetchCart/fetchMe) così non si cancella input guest
    // e la precompilazione auth non viene sovrascritta dal reset tardivo.
    if (!isResumeFlow) {
      resetCheckout()
    }

    void (async () => {
      await fetchCart({ force: true, reprice: true })
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
          const retryStep = searchParams.get('step')
          const retryMethod = searchParams.get('method')
          if (retryMethod === 'stripe' || retryMethod === 'bank_transfer') {
            setPaymentMethod(retryMethod)
          }
          if (retryStep === 'payment') {
            checkoutStore.currentStep = 'payment'
          }
          return
        } catch {
          resetCheckout()
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
      step: checkoutStore.currentStep,
    })
    if (isFrozenQuoteCheckout()) return
    if (checkoutStore.initLoadingPhase || checkoutStore.addressPrefillLoading) return
    if (!auth.isLoading && auth.me) {
      void initializeCheckoutNavigation()
    }
    if (!auth.isLoading && !auth.isAuthenticated && checkoutStore.currentStep !== 'account') {
      checkoutStore.currentStep = 'account'
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.me])

  const c = cart.cart
  const frozenCheckout = isFrozenQuoteCheckout()
  const displayCart =
    frozenCheckout && checkout.frozenOrderSummary
      ? cartFromFrozenQuoteSummary({ ...checkout.frozenOrderSummary, lines: [...checkout.frozenOrderSummary.lines] })
      : c
  const step = checkout.currentStep
  const shippingQuote = selectedShippingQuote()
  const canPay =
    canStartCheckout() &&
    !checkout.isLoading &&
    !checkout.isPaying &&
    !checkout.cartRefreshing &&
    checkout.termsAccepted
  const totalCents = displayCart
    ? checkoutTotalCents(displayCart, shippingQuote, checkout.taxBreakdown)
    : checkout.order?.amountTotal ?? 0

  const recommendationKey =
    displayCart?.items.map((line) => `${line.productRef}:${line.quantity}`).sort().join('|') ?? ''

  useEffect(() => {
    if (recommendationKey) {
      checkoutDbg.effect('fetchRecommendations', { recommendationKey })
      void fetchRecommendations()
    }
  }, [recommendationKey])

  function handleCrossSellAdded() {
    void refreshCheckoutAfterCartChange()
  }

  const loadingState = useStableCheckoutLoading(
    resolveCheckoutLoading({
      step,
      isLoading: checkout.isLoading,
      isPaying: checkout.isPaying,
      cartRefreshing: checkout.cartRefreshing,
      initLoadingPhase: checkout.initLoadingPhase,
      addressPrefillLoading: checkout.addressPrefillLoading,
      transitionToPaymentLoading: checkout.transitionToPaymentLoading,
      shippingQuotesLoading: checkout.shippingQuotesLoading,
      shippingSelecting: Boolean(checkout.shippingSelectingRef),
      cartLoading: cart.isLoading && !c,
    }),
  )

  useEffect(() => {
    if (isFrozenQuoteCheckout()) return
    if (step === 'addresses' || step === 'payment' || step === 'review') {
      checkoutDbg.effect('refreshTaxBreakdown', {
        step,
        vatValidated: checkout.business.vatValidated,
      })
      void refreshTaxBreakdown()
    }
  }, [
    step,
    checkout.draft.shipping,
    checkout.draft.billing,
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

  useEffect(() => {
    if (isFrozenQuoteCheckout()) return
    if (step !== 'addresses') return
    if (!canAdvanceFromStep('addresses')) return
    prefetchCheckoutTransitionToPayment()
  }, [
    step,
    checkout.draft.email,
    checkout.draft.shipping,
    checkout.draft.billing,
    checkout.draft.billingSameAsShipping,
    checkout.selectedShippingMethodRef,
    checkout.shippingSelectionPersisted,
    checkout.shippingSelectingRef,
    checkout.selectedPaymentMethod,
    checkout.clientOrderRef,
    checkout.business.vatNumber,
    checkout.business.fiscalCode,
    checkout.business.companyName,
    checkout.deliveryRecipient.mode,
  ])

  useEffect(() => {
    if (isFrozenQuoteCheckout()) return
    if (step !== 'addresses' && step !== 'payment' && step !== 'review') return
    prefetchCheckoutPayment()
  }, [
    step,
    checkout.draft.email,
    checkout.draft.shipping,
    checkout.draft.billing,
    checkout.draft.billingSameAsShipping,
    checkout.selectedShippingMethodRef,
    checkout.shippingSelectionPersisted,
    checkout.shippingSelectingRef,
    checkout.selectedPaymentMethod,
    checkout.cartRefreshing,
    checkout.payment,
    checkout.order,
  ])

  useEffect(() => {
    const guards = {
      step,
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

    if (step !== 'payment' && step !== 'review') return
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
    if (checkout.payment?.method === 'stripe' && checkout.payment.clientSecret) {
      checkoutDbg.fn('prepareStripeSession', 'skip', { reason: 'payment already exists' })
      return
    }

    const form = checkout.draft
    const prepareKey = [
      checkout.selectedShippingMethodRef,
      form.email,
      form.billingSameAsShipping ? 'same' : 'diff',
      JSON.stringify(form.shipping),
      JSON.stringify(form.billing),
      checkout.selectedPaymentMethod,
    ].join('|')

    if (checkoutPrepareBlockedRef.current && checkoutPrepareKeyRef.current === prepareKey) {
      checkoutDbg.fn('prepareStripeSession', 'skip', { reason: 'blocked after error', prepareKey })
      return
    }

    checkoutDbg.fn('prepareStripeSession', 'enter', { prepareKey })
    void (async () => {
      checkoutPrepareKeyRef.current = prepareKey
      try {
        if (!checkoutStore.order) await startCheckout({ silent: true })
        if (!checkoutStore.payment?.clientSecret) await createPaymentSession({ silent: true })
        checkoutPrepareBlockedRef.current = false
        checkoutDbg.fn('prepareStripeSession', 'exit', {
          orderId: checkoutStore.order?.orderId,
          hasClientSecret: Boolean(checkoutStore.payment?.clientSecret),
        })
      } catch (e) {
        checkoutPrepareBlockedRef.current = true
        checkoutDbg.fn('prepareStripeSession', 'error', {
          message: e instanceof Error ? e.message : String(e),
        })
      }
    })()
  }, [
    step,
    checkout.draft.email,
    checkout.draft.shipping,
    checkout.draft.billing,
    checkout.draft.billingSameAsShipping,
    checkout.selectedShippingMethodRef,
    checkout.shippingSelectionPersisted,
    checkout.shippingSelectingRef,
    checkout.selectedPaymentMethod,
    checkout.isLoading,
    checkout.isPaying,
    checkout.cartRefreshing,
    checkout.payment,
    checkout.order,
  ])

  async function handlePay() {
    if (checkoutStore.cartRefreshing) return
    checkoutStore.error = null
    checkoutStore.isPaying = true
    try {
      if (checkout.selectedPaymentMethod === 'bank_transfer') {
        const orderId = await completeBankTransferCheckout()
        void fetchCart({ force: true, reprice: true })
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
        checkoutStore.error = t('checkout.payment.formNotReady')
        return
      }
      await form.pay()
    } catch (e) {
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
    void fetchCart({ force: true, reprice: true })
    navigate(`/checkout/result/${paidOrderId}`, { replace: true })
  }

  const isCartUnresolved = !frozenCheckout && !c
  const isCartEmpty = !frozenCheckout && c != null && c.items.length === 0

  if (isCartEmpty && !cart.isLoading) {
    return (
      <div className="checkout-root flex min-h-screen items-center justify-center bg-idl-tech-panel px-4 py-12">
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

  const shouldMountPaymentStep =
    step === 'payment' ||
    step === 'review' ||
    (checkout.selectedPaymentMethod === 'stripe' && Boolean(activeStripeSession?.clientSecret))

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
        if (msg) checkoutStore.error = msg
      }}
    />
  ) : canStartCheckout() && checkout.selectedPaymentMethod === 'stripe' ? (
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
            recommendations={cart.recommendations}
            recommendationsLoading={cart.isRecommendationsLoading}
            onCrossSellAdded={handleCrossSellAdded}
            onRemoveItem={frozenCheckout ? undefined : (id) => void handleRemoveFromCheckout(id)}
            removeDisabled={cart.isLoading || checkout.cartRefreshing || frozenCheckout}
          />
          <CheckoutOrderSummary
            cart={displayCart}
            selectedShipping={shippingQuote}
            freeShippingHint={checkout.freeShippingHint}
            taxBreakdown={checkout.taxBreakdown}
            recommendations={cart.recommendations}
            recommendationsLoading={cart.isRecommendationsLoading}
            onCrossSellAdded={handleCrossSellAdded}
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
            <p className="mb-4 rounded-xl border border-[#c9a24b]/30 bg-[#f8f8f6] px-4 py-3 text-sm text-[#9a7b33]">
              {t('cart.quote.frozenNotice')}
            </p>
          ) : null}

          <CheckoutStepIndicator currentStep={step} />

          {checkout.error ? <StripeErrorBanner message={checkout.error} /> : null}

          {step === 'account' ? (
            <CheckoutStepBody>
              <CheckoutRegistrationStep />
            </CheckoutStepBody>
          ) : null}
          {step === 'customer_type' ? (
            <CheckoutStepBody>
              <CheckoutCustomerTypeStep />
            </CheckoutStepBody>
          ) : null}
          {step === 'addresses' ? (
            <CheckoutStepBody>
              <CheckoutAddressesStep />
            </CheckoutStepBody>
          ) : null}
          {step === 'delivery_recipient' ? (
            <CheckoutStepBody>
              <CheckoutDeliveryRecipientStep />
            </CheckoutStepBody>
          ) : null}
          {step === 'shipping_method' ? (
            <CheckoutStepBody>
              <CheckoutShippingMethodStep />
            </CheckoutStepBody>
          ) : null}
          {shouldMountPaymentStep ? (
            <div
              className={cn(
                step !== 'payment' &&
                  'pointer-events-none fixed -left-[10000px] top-0 z-[-1] h-[520px] w-[min(100%,24rem)] overflow-hidden opacity-0',
              )}
              aria-hidden={step !== 'payment'}
            >
              <CheckoutStepBody>
                <CheckoutPaymentStep stripeCardDetails={stripeCardDetails} />
              </CheckoutStepBody>
            </div>
          ) : null}
          {step === 'review' ? (
            <CheckoutStepBody>
              <CheckoutReviewStep
                cart={displayCart as CartDTO}
                onConfirmPay={() => void handlePay()}
                payLabel={payLabel}
                canPay={
                  canPay &&
                  (checkout.selectedPaymentMethod !== 'stripe' ||
                    Boolean(activeStripeSession?.clientSecret && stripeReady))
                }
              />
              {checkout.selectedPaymentMethod === 'bank_transfer' ? (
                <section className="mt-6 rounded-xl border border-idl-tech-border bg-idl-tech-panel p-4">
                  <BankTransferAwaitingNote />
                </section>
              ) : null}
            </CheckoutStepBody>
          ) : null}

          <footer className="mt-10 lg:hidden">
            <CheckoutLegalLinks theme="light" className="justify-center" />
          </footer>
        </div>
      </main>
    </div>
  )
}
