'use client'

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { cartStore, fetchCart, fetchRecommendations, removeItem } from '@/features/cart'
import { authStore, fetchMe } from '@/features/auth'
import {
  canStartCheckout,
  cartFromFrozenQuoteSummary,
  checkoutStore,
  completeBankTransferCheckout,
  createPaymentSession,
  initializeCheckoutNavigation,
  invalidateCheckoutAfterCartChange,
  isFrozenQuoteCheckout,
  prepareCheckoutPayment,
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
import { CheckoutBillingStep } from '@/components/checkout/stripe-ui/CheckoutBillingStep'
import { CheckoutShippingStep } from '@/components/checkout/stripe-ui/CheckoutShippingStep'
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
import {
  checkoutColumnGutterClass,
  checkoutFormColumnClass,
  checkoutFormContentClass,
  checkoutMainClass,
  checkoutShellClass,
} from '@/components/checkout/stripe-ui/constants'
import { useI18n } from '@/hooks/use-i18n'
import { ApiRequestError } from '@/types/api'
import { preloadStripe } from '@/lib/stripe-loader'

export function CheckoutPage() {
  const { t, tParams } = useI18n()
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  const cart = useSnapshot(cartStore)
  const checkout = useSnapshot(checkoutStore)
  const auth = useSnapshot(authStore)
  const stripeFormRef = useRef<StripePaymentFormHandle>(null)
  const [stripeReady, setStripeReady] = useState(false)
  const checkoutPrepareKeyRef = useRef<string | null>(null)
  const checkoutPrepareBlockedRef = useRef(false)

  useEffect(() => {
    preloadStripe()
    const retryOrderId = searchParams.get('retryOrder')
    const frozenOrderId = searchParams.get('orderId')
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
          void initializeCheckoutNavigation()
          return
        }
      }
      resetCheckout()
      void initializeCheckoutNavigation()
    })()
  }, [searchParams])

  useEffect(() => {
    if (isFrozenQuoteCheckout()) return
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
    checkout.termsAccepted
  const totalCents = displayCart
    ? checkoutTotalCents(displayCart, shippingQuote, checkout.taxBreakdown)
    : checkout.order?.amountTotal ?? 0

  const recommendationKey =
    displayCart?.items.map((line) => `${line.productRef}:${line.quantity}`).sort().join('|') ?? ''

  useEffect(() => {
    if (recommendationKey) void fetchRecommendations()
  }, [recommendationKey])

  function handleCrossSellAdded() {
    invalidateCheckoutAfterCartChange()
    void fetchCart({ force: true })
  }

  const loadingState = useStableCheckoutLoading(
    resolveCheckoutLoading({
      step,
      isLoading: checkout.isLoading,
      isPaying: checkout.isPaying,
      addressPrefillLoading: checkout.addressPrefillLoading,
      shippingQuotesLoading: checkout.shippingQuotesLoading,
      cartLoading: cart.isLoading && !c,
    }),
  )

  useEffect(() => {
    if (isFrozenQuoteCheckout()) return
    if (step === 'shipping_method' || step === 'payment' || step === 'review') {
      void refreshTaxBreakdown()
    }
  }, [
    step,
    checkout.draft.shipping,
    checkout.draft.billing,
    checkout.selectedShippingMethodRef,
    checkout.business.vatValidated,
    checkout.business.vatForceAccepted,
    checkout.customerSegment,
  ])

  useEffect(() => {
    checkoutPrepareBlockedRef.current = false
    checkoutPrepareKeyRef.current = null
    setStripeReady(false)
  }, [checkout.selectedPaymentMethod])

  useEffect(() => {
    if (step !== 'review' || checkout.selectedPaymentMethod !== 'stripe') return
    if (
      !canStartCheckout() ||
      checkout.isLoading ||
      checkout.isPaying ||
      checkout.shippingSelectingRef ||
      !checkout.shippingSelectionPersisted
    ) {
      return
    }
    if (checkout.payment) return

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
      return
    }

    const timer = setTimeout(() => {
      void (async () => {
        checkoutPrepareKeyRef.current = prepareKey
        try {
          if (!checkoutStore.order) await startCheckout({ silent: true })
          if (!checkoutStore.payment) await createPaymentSession({ silent: true })
          checkoutPrepareBlockedRef.current = false
        } catch {
          checkoutPrepareBlockedRef.current = true
        }
      })()
    }, 400)

    return () => clearTimeout(timer)
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
    checkout.payment,
    checkout.order,
  ])

  async function handlePay() {
    checkoutStore.error = null
    checkoutStore.isPaying = true
    try {
      if (checkout.selectedPaymentMethod === 'bank_transfer') {
        const orderId = await completeBankTransferCheckout()
        void fetchCart({ force: true })
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
    void fetchCart({ force: true })
    navigate(`/checkout/result/${paidOrderId}`, { replace: true })
  }

  if ((!displayCart || displayCart.items.length === 0) && !frozenCheckout && !cart.isLoading) {
    return (
      <div className="checkout-root flex min-h-screen items-center justify-center bg-white px-4 py-12">
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
    await removeItem(itemId)
    invalidateCheckoutAfterCartChange()
    await fetchCart({ force: true })
  }

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
            removeDisabled={cart.isLoading || frozenCheckout}
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
            removeDisabled={cart.isLoading || frozenCheckout}
          />
        </>
      ) : null}

      <main className={checkoutMainClass}>
        <div
          className={cn(
            checkoutFormColumnClass,
            'w-full border-b border-white/10 bg-[#16130d] py-3 sm:py-3.5 lg:hidden',
            checkoutColumnGutterClass,
          )}
        >
          <CheckoutSummaryHeader theme="dark" />
        </div>

        <div className={checkoutFormContentClass}>
          {frozenCheckout ? (
            <p className="mb-4 rounded-xl border border-[#f0ad57]/30 bg-[#faf6ef] px-4 py-3 text-sm text-[#9a6a2f]">
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
          {step === 'billing' ? (
            <CheckoutStepBody>
              <CheckoutBillingStep />
            </CheckoutStepBody>
          ) : null}
          {step === 'shipping' ? (
            <CheckoutStepBody>
              <CheckoutShippingStep />
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
          {step === 'payment' ? (
            <CheckoutStepBody>
              <CheckoutPaymentStep />
            </CheckoutStepBody>
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
                    Boolean(checkout.payment?.clientSecret && stripeReady))
                }
              />
              {checkout.selectedPaymentMethod === 'stripe' ? (
                <section className="mt-6">
                  {checkout.payment?.method === 'stripe' && checkout.payment.clientSecret ? (
                    <StripePaymentShell
                      clientSecret={checkout.payment.clientSecret}
                      publishableKey={checkout.payment.publishableKey}
                      orderId={checkout.payment.orderId}
                      formRef={stripeFormRef}
                      onReadyChange={setStripeReady}
                      onBeforeConfirm={prepareCheckoutPayment}
                      onPaymentSuccess={handleStripePaymentSuccess}
                      onError={(msg) => {
                        if (msg) checkoutStore.error = msg
                      }}
                    />
                  ) : canStartCheckout() ? (
                    <CheckoutPaymentSkeleton />
                  ) : null}
                </section>
              ) : (
                <section className="mt-6 rounded-xl border border-[#e2e6eb] bg-[#f7f8fa] p-4">
                  <BankTransferAwaitingNote />
                </section>
              )}
            </CheckoutStepBody>
          ) : null}

          <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-2 text-xs text-[#9298a3] lg:hidden">
            <span>{t('checkout.poweredByStripe')}</span>
            <span aria-hidden>·</span>
            <Link to="/" className="hover:text-[#14161b]">
              {t('legal.terms')}
            </Link>
            <span aria-hidden>·</span>
            <Link to="/" className="hover:text-[#14161b]">
              {t('legal.privacy')}
            </Link>
          </footer>
        </div>
      </main>

      {loadingState?.visible ? (
        <CheckoutLoadingOverlay icon={loadingState.icon} messageKey={loadingState.messageKey} />
      ) : null}
    </div>
  )
}
