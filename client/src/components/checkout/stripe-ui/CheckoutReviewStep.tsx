'use client'

import { useSnapshot } from 'valtio/react'
import type { ReactNode } from 'react'
import type { CartDTO, ShippingQuoteDTO } from '@/types/dto'
import { formatStreetLine } from '@/lib/checkout-address.validators'
import {
  canStartCheckout,
  checkoutStore,
  prepareCheckoutPayment,
  selectedShippingQuote,
  setTermsAccepted,
  updateCheckoutOrderNotes,
} from '@/features/checkout'
import { formatMoney } from '@/lib/format'
import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import { checkoutTotalCents } from './CheckoutOrderSummary'
import {
  CheckoutReviewCard,
  CheckoutReviewRow,
} from './CheckoutStepPrimitives'
import { useI18n } from '@/hooks/use-i18n'
import {
  CheckoutActionRow,
  StripePayButton,
} from './StripeFields'
import { CheckoutStepBackButton } from './CheckoutStepBackButton'

type Props = {
  cart: Readonly<CartDTO>
  onConfirmPay: () => void
  payLabel: string
  canPay: boolean
}

function formatAddress(address: {
  firstName: string
  lastName: string
  line1: string
  streetNumber?: string
  isSnc?: boolean
  line2?: string
  city: string
  postalCode: string
  country: string
  courierNotes?: string
}) {
  const name = [address.firstName, address.lastName].filter(Boolean).join(' ')
  const street = formatStreetLine(address)
  const snc = address.isSnc ? ' (SNC)' : ''
  const lines = [
    name,
    `${street}${snc}`,
    address.line2,
    `${address.postalCode} ${address.city}`,
    address.country,
    address.courierNotes?.trim() ? `${address.courierNotes.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n')
  return lines
}

function LegalPolicyLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      to={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-idl-graphite underline decoration-[#0c0c0d]/70 underline-offset-2 hover:decoration-[#3a3a3d]"
    >
      {children}
    </Link>
  )
}

export function CheckoutReviewStep({ cart, onConfirmPay, payLabel, canPay }: Props) {
  const { t } = useI18n()
  const lp = useLocalePath()
  const checkout = useSnapshot(checkoutStore)
  const shippingQuote: ShippingQuoteDTO | null = selectedShippingQuote()
  const totalCents = checkoutTotalCents(cart, shippingQuote, checkout.taxBreakdown)
  const tax = checkout.taxBreakdown

  return (
    <section className="space-y-5">
      <CheckoutReviewCard title={t('checkout.review.summaryTitle')}>
        {shippingQuote ? (
          <CheckoutReviewRow label={t('checkout.summary.shipping')} value={shippingQuote.label} />
        ) : null}
        {tax ? (
          <>
            <CheckoutReviewRow
              label={t('checkout.summary.subtotal')}
              value={formatMoney(tax.netCents, cart.currencyCode)}
            />
            <CheckoutReviewRow label={tax.taxLabel} value={formatMoney(tax.taxCents, cart.currencyCode)} />
            <CheckoutReviewRow
              label={t('checkout.summary.shipping')}
              value={
                shippingQuote?.amountCents === 0
                  ? t('checkout.summary.free')
                  : formatMoney(shippingQuote?.amountCents ?? 0, cart.currencyCode)
              }
            />
          </>
        ) : null}
        <CheckoutReviewRow
          label={t('checkout.summary.total')}
          value={formatMoney(totalCents, cart.currencyCode)}
          strong
        />
      </CheckoutReviewCard>

      <details className="rounded-xl border border-[#e7eaee] bg-idl-tech-panel px-4 py-3">
        <summary className="cursor-pointer text-sm font-bold text-idl-graphite">
          {t('checkout.review.detailsToggle')}
        </summary>
        <div className="mt-3 space-y-3 border-t border-idl-tech-border pt-3 text-sm text-[#5b616b]">
          <div>
            <p className="font-semibold text-idl-graphite">{t('common.email')}</p>
            <p>{checkout.draft.email}</p>
          </div>
          <div>
            <p className="font-semibold text-idl-graphite">{t('checkout.billingAddress')}</p>
            <pre className="mt-1 whitespace-pre-wrap font-sans">
              {formatAddress(
                checkout.draft.billingSameAsShipping ? checkout.draft.shipping : checkout.draft.billing,
              )}
            </pre>
          </div>
          <div>
            <p className="font-semibold text-idl-graphite">{t('checkout.shippingAddress')}</p>
            <pre className="mt-1 whitespace-pre-wrap font-sans">
              {formatAddress(checkout.draft.shipping)}
            </pre>
          </div>
          <CheckoutReviewRow
            label={t('checkout.payment')}
            value={
              checkout.selectedPaymentMethod === 'bank_transfer'
                ? t('checkout.payment.bankTransfer')
                : t('checkout.payment.card')
            }
          />
        </div>
      </details>

      <div className="space-y-2">
        <label htmlFor="checkout-order-notes" className="block text-sm font-semibold text-idl-graphite">
          {t('checkout.orderNotes')}
        </label>
        <textarea
          id="checkout-order-notes"
          name="orderNotes"
          rows={3}
          value={checkout.draft.orderNotes}
          placeholder={t('checkout.orderNotesPlaceholder')}
          className="idl-field block w-full resize-none px-[15px] py-3.5 text-[15px] outline-none focus:ring-2 focus:ring-[#0c0c0d]/35"
          onChange={(e) => updateCheckoutOrderNotes(e.target.value)}
        />
      </div>

      <p className="text-xs leading-relaxed text-[#5b616b]">
        {t('checkout.review.legalAcceptanceBeforeTerms')}{' '}
        <LegalPolicyLink href={lp('/tos')}>{t('checkout.review.legalTermsLink')}</LegalPolicyLink>
        {t('checkout.review.legalAcceptanceBetween')}{' '}
        <LegalPolicyLink href={lp('/privacy-policy')}>{t('checkout.review.legalPrivacyLink')}</LegalPolicyLink>
        {t('checkout.review.legalAcceptanceAnd')}{' '}
        <LegalPolicyLink href={lp('/privacy-policy')}>{t('checkout.review.legalCookieLink')}</LegalPolicyLink>
        {t('checkout.review.legalAcceptanceAfter')}
      </p>

      <p className="text-center text-xs text-[#9298a3]">{t('checkout.review.secureFooter')}</p>

      <CheckoutActionRow>
        <CheckoutStepBackButton />
        <StripePayButton
          className="min-w-0 flex-1"
          disabled={!canPay || !canStartCheckout()}
          loading={checkout.isLoading || checkout.isPaying || checkout.cartRefreshing}
          variant="pay"
          onClick={() => {
            void (async () => {
              try {
                setTermsAccepted(true)
                await prepareCheckoutPayment()
                onConfirmPay()
              } catch {
                /* errore in store */
              }
            })()
          }}
        >
          {payLabel}
        </StripePayButton>
      </CheckoutActionRow>
    </section>
  )
}
