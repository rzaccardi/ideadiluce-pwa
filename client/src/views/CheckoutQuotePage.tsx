'use client'

import { useEffect, useRef, useState } from 'react'
import { Link } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { EmptyCartPrompt } from '@/components/cart/EmptyCartPrompt'
import {
  CheckoutOrderSummary,
  CheckoutSummaryHeader,
} from '@/components/checkout/stripe-ui/CheckoutOrderSummary'
import { CheckoutStepBody } from '@/components/checkout/stripe-ui/CheckoutStepBody'
import { StripeErrorBanner } from '@/components/checkout/stripe-ui/StripeFields'
import {
  checkoutColumnGutterClass,
  checkoutFormColumnClass,
  checkoutFormContentClass,
  checkoutMainClass,
  checkoutShellClass,
} from '@/components/checkout/stripe-ui/constants'
import { QuoteDetailsStep } from '@/components/checkout/quote-ui/QuoteDetailsStep'
import { QuoteRegistrationStep } from '@/components/checkout/quote-ui/QuoteRegistrationStep'
import { QuoteStepIndicator, type QuoteStep } from '@/components/checkout/quote-ui/QuoteStepIndicator'
import { QuoteSuccessStep } from '@/components/checkout/quote-ui/QuoteSuccessStep'
import { authStore, fetchMe } from '@/features/auth'
import { submitQuoteRequest, quotesStore } from '@/features/quotes'
import { cartStore, fetchCart, fetchRecommendations, removeItem } from '@/features/cart'
import { cartHasBlockedLines, cartPurchasableItemCount } from '@/lib/cartTotals'
import { emptyAddress, shippingAddressFromUser, addressInputToDto, isAddressComplete } from '@/lib/address'
import type { AddressInput } from '@/types/integrations'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

export function CheckoutQuotePage() {
  const { t } = useI18n()
  const auth = useSnapshot(authStore)
  const cart = useSnapshot(cartStore)
  const quotes = useSnapshot(quotesStore)
  const [step, setStep] = useState<QuoteStep>('account')
  const [quoteEmail, setQuoteEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [billingAddress, setBillingAddress] = useState<AddressInput>(emptyAddress)
  const [successId, setSuccessId] = useState<string | null>(null)
  const initialNavDoneRef = useRef(false)

  useEffect(() => {
    void fetchCart({ force: true })
    void fetchMe()
  }, [])

  useEffect(() => {
    if (successId) {
      setStep('success')
      return
    }
    if (auth.me) {
      setBillingAddress(shippingAddressFromUser(auth.me))
      if (!initialNavDoneRef.current) {
        initialNavDoneRef.current = true
        setStep('details')
      }
    } else if (!auth.isLoading) {
      initialNavDoneRef.current = false
      setStep('account')
    }
  }, [auth.me, auth.isLoading, successId])

  const c = cart.cart
  const recommendationKey =
    c?.items.map((line) => `${line.productRef}:${line.quantity}`).sort().join('|') ?? ''

  useEffect(() => {
    if (recommendationKey) void fetchRecommendations()
  }, [recommendationKey])

  function updateBilling<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
    setBillingAddress((current) => ({ ...current, [key]: value }))
  }

  async function onAuthSuccess(info: {
    mode: 'register' | 'login'
    email: string
    firstName?: string
    lastName?: string
    phone?: string
  }) {
    if (info.mode === 'register' && (info.firstName || info.lastName)) {
      setBillingAddress((current) => ({
        ...current,
        firstName: info.firstName ?? current.firstName,
        lastName: info.lastName ?? current.lastName,
        phone: info.phone ?? current.phone,
      }))
    }
    await fetchCart({ force: true })
    setStep('details')
  }

  async function onSubmit() {
    quotesStore.submitError = null
    if (!auth.me) {
      setStep('account')
      return
    }
    if (!isAddressComplete(billingAddress)) {
      quotesStore.submitError = t('checkout.error.incompleteAddress')
      return
    }
    try {
      const billing = addressInputToDto(billingAddress)
      const result = await submitQuoteRequest({
        notes: notes.trim() || undefined,
        billingAddress: billing ?? undefined,
        shippingAddress: billing ?? undefined,
      })
      setSuccessId(result.id)
    } catch {
      /* errore in store */
    }
  }

  async function handleRemoveFromQuote(itemId: string) {
    await removeItem(itemId)
    await fetchCart({ force: true })
  }

  const hasBlockedLines = c ? cartHasBlockedLines(c) : false
  const purchasableCount = c ? cartPurchasableItemCount(c) : 0
  const quoteBlocked = !c?.items.length || hasBlockedLines || purchasableCount === 0

  if (c && c.items.length === 0 && !cart.isLoading && !successId) {
    return (
      <div className="checkout-root flex min-h-dvh items-center justify-center bg-white px-4 py-12">
        <EmptyCartPrompt compact className="w-full max-w-md" />
      </div>
    )
  }

  return (
    <div className={checkoutShellClass}>
      {c && step !== 'success' ? (
        <>
          <CheckoutOrderSummary
            cart={c}
            selectedShipping={null}
            mobileOnly
            recommendations={cart.recommendations}
            recommendationsLoading={cart.isRecommendationsLoading}
            onRemoveItem={(id) => void handleRemoveFromQuote(id)}
            removeDisabled={cart.isLoading || quotes.isSubmitting}
          />
          <CheckoutOrderSummary
            cart={c}
            selectedShipping={null}
            recommendations={cart.recommendations}
            recommendationsLoading={cart.isRecommendationsLoading}
            onRemoveItem={(id) => void handleRemoveFromQuote(id)}
            removeDisabled={cart.isLoading || quotes.isSubmitting}
          />
        </>
      ) : null}

      <main className={checkoutMainClass}>
        {c && step !== 'success' ? (
          <div
            className={cn(
              checkoutFormColumnClass,
              'w-full border-b border-white/10 bg-[#16130d] py-3 sm:py-3.5 lg:hidden',
              checkoutColumnGutterClass,
            )}
          >
            <CheckoutSummaryHeader theme="dark" />
          </div>
        ) : null}

        <div className={checkoutFormContentClass}>
          <QuoteStepIndicator
            currentStep={step}
            accountConfirmed={step === 'account' && auth.isAuthenticated}
          />

          {quotes.submitError ? <StripeErrorBanner message={quotes.submitError} /> : null}

          {step === 'account' ? (
            <CheckoutStepBody>
              <QuoteRegistrationStep
                email={quoteEmail}
                onEmailChange={setQuoteEmail}
                onAuthSuccess={onAuthSuccess}
                onContinue={() => setStep('details')}
              />
            </CheckoutStepBody>
          ) : null}

          {step === 'details' ? (
            <CheckoutStepBody>
              <QuoteDetailsStep
                billingAddress={billingAddress}
                notes={notes}
                onNotesChange={setNotes}
                onBillingChange={updateBilling}
                onBack={() => setStep('account')}
                onSubmit={onSubmit}
                submitting={quotes.isSubmitting}
                submitDisabled={quoteBlocked}
                hasBlockedLines={hasBlockedLines}
                noPurchasableLines={Boolean(c && c.items.length > 0 && purchasableCount === 0)}
              />
            </CheckoutStepBody>
          ) : null}

          {step === 'success' ? (
            <CheckoutStepBody>
              <QuoteSuccessStep />
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
    </div>
  )
}
