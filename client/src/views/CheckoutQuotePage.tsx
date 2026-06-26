'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/Button'
import { InlineAccountAuthStep } from '@/components/auth/InlineAccountAuthStep'
import { StripeErrorBanner } from '@/components/checkout/stripe-ui/StripeFields'
import { CheckoutAddressSection } from '@/components/checkout/stripe-ui/CheckoutAddressSection'
import { authStore, fetchMe } from '@/features/auth'
import { submitQuoteRequest, quotesStore } from '@/features/quotes'
import { cartStore, fetchCart } from '@/features/cart'
import { formatMoney } from '@/lib/format'
import { cartHasBlockedLines, cartPurchasableItemCount } from '@/lib/cartTotals'
import { emptyAddress, shippingAddressFromUser, addressInputToDto, isAddressComplete } from '@/lib/address'
import type { AddressInput } from '@/types/integrations'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'

type QuoteStep = 'account' | 'details'

export function CheckoutQuotePage() {
  const { t } = useI18n()
  const lp = useLocalePath()
  const auth = useSnapshot(authStore)
  const cart = useSnapshot(cartStore)
  const quotes = useSnapshot(quotesStore)
  const [step, setStep] = useState<QuoteStep>('account')
  const [quoteEmail, setQuoteEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [billingAddress, setBillingAddress] = useState<AddressInput>(emptyAddress)
  const [successId, setSuccessId] = useState<string | null>(null)

  useEffect(() => {
    void fetchCart({ force: true })
    void fetchMe()
  }, [])

  useEffect(() => {
    if (auth.me) {
      setBillingAddress(shippingAddressFromUser(auth.me))
      setStep('details')
    } else if (!auth.isLoading) {
      setStep('account')
    }
  }, [auth.me, auth.isLoading])

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
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

  const c = cart.cart
  const hasBlockedLines = c ? cartHasBlockedLines(c) : false
  const purchasableCount = c ? cartPurchasableItemCount(c) : 0
  const quoteBlocked = !c?.items.length || hasBlockedLines || purchasableCount === 0

  if (successId) {
    return (
      <div>
        <PageHeader title={t('cart.quote.title')} description={t('cart.quote.success')} />
        <div className="mx-auto max-w-lg rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
          <p className="text-sm text-emerald-950">{t('cart.quote.success')}</p>
          <p className="mt-3 text-sm text-emerald-900/80">{t('cart.quote.successPending')}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/account/quotes">
              <Button>{t('account.quotes.title')}</Button>
            </Link>
            <Link to="/cart">
              <Button variant="secondary">{t('cart.quote.backToCart')}</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (c && c.items.length === 0 && !cart.isLoading) {
    return (
      <div>
        <PageHeader title={t('cart.quote.title')} description={t('cart.quote.description')} />
        <div className="mx-auto max-w-lg rounded-lg border border-idl-border bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-idl-muted">{t('cart.quote.emptyCart')}</p>
          <div className="mt-6">
            <Link to="/cart">
              <Button>{t('cart.quote.backToCart')}</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t('cart.quote.title')} description={t('cart.quote.description')} />
      <div className="mx-auto max-w-2xl space-y-6">
        {step === 'account' && !auth.me ? (
          <div className="rounded-lg border border-idl-border bg-white p-6 shadow-sm shadow-idl-ink/5">
            <InlineAccountAuthStep
              email={quoteEmail}
              onEmailChange={setQuoteEmail}
              forgotPasswordFrom={lp('/checkout/quote')}
              title={t('cart.quote.accountTitle')}
              hint={t('cart.quote.accountHint')}
              registerContinueLabel={t('cart.quote.accountContinue')}
              loginContinueLabel={t('cart.quote.accountContinue')}
              onAuthSuccess={onAuthSuccess}
            />
            <div className="mt-6 border-t border-idl-border pt-4">
              <Link to="/cart">
                <Button variant="secondary" className="w-full justify-center">
                  {t('cart.quote.backToCart')}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {hasBlockedLines ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {t('cart.unpurchasable.blockedCheckout')}
              </div>
            ) : null}
            {purchasableCount === 0 && c && c.items.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {t('cart.unpurchasable.noPurchasableLines')}
              </div>
            ) : null}

            <section className="rounded-lg border border-idl-border bg-white p-6 shadow-sm shadow-idl-ink/5">
              <h2 className="text-sm font-semibold text-idl-graphite">{t('cart.quote.reviewLines')}</h2>
              {!c || c.items.length === 0 ? (
                <p className="mt-4 text-sm text-idl-muted">{t('cart.quote.emptyCart')}</p>
              ) : (
                <ul className="mt-4 divide-y divide-idl-border text-sm">
                  {c.items.map((line) => (
                    <li key={line.id} className="flex justify-between gap-4 py-3">
                      <span>
                        {line.productName ?? line.productRef} × {line.quantity}
                        {line.availabilityStatus === 'blocked' ? (
                          <span className="ml-2 text-xs text-amber-700">({t('cart.unpurchasable.badge')})</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-idl-muted">
                        {formatMoney(line.lineTotalEstimateCents ?? 0, c.currencyCode)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <form
              onSubmit={(e) => void onSubmit(e)}
              className="space-y-6 rounded-lg border border-idl-border bg-white p-6 shadow-sm shadow-idl-ink/5"
            >
              <CheckoutAddressSection
                title={t('checkout.billingAddress')}
                prefix="quote-billing"
                address={billingAddress}
                onChange={updateBilling}
              />

              <label className="block text-sm">
                <span className="font-medium text-idl-graphite">{t('cart.quote.notesLabel')}</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="mt-1.5 w-full rounded-lg border border-idl-border px-3 py-2 text-sm"
                  placeholder={t('cart.quote.notesPlaceholder')}
                />
              </label>

              {quotes.submitError ? <StripeErrorBanner message={quotes.submitError} /> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  loading={quotes.isSubmitting}
                  disabled={quoteBlocked}
                  className="flex-1 justify-center"
                >
                  {t('cart.quote.submit')}
                </Button>
                <Link to="/cart" className="flex-1">
                  <Button variant="secondary" className="w-full justify-center">
                    {t('cart.quote.backToCart')}
                  </Button>
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
