'use client'

import { Link } from '@/lib/navigation'
import type { CartDTO, CartItemDTO } from '@/types/dto'

/** Compatibile con snapshot Valtio (readonly). */
type CartLike = Omit<CartDTO, 'items' | 'warnings'> & {
  items: ReadonlyArray<CartItemDTO>
  warnings?: ReadonlyArray<string>
}
import { formatMoney } from '@/lib/format'
import {
  cartHasBlockedLines,
  cartShippingCents,
  cartSubtotalCents,
  cartTaxCents,
  cartTotalCents,
} from '@/lib/cartTotals'
import { Button } from '@/components/Button'
import { ProfessionalCartBanner } from '@/components/cart/PricelistBadge'
import {
  BonificoBancarioLogo,
  MastercardLogo,
  PayPalLogo,
  VisaLogo,
} from '@/components/payment-method-logos'
import { useI18n } from '@/hooks/use-i18n'
import { preloadStripe } from '@/lib/stripe-loader'
import { CART_CARD_SURFACE } from '@/components/cart/cart-surfaces'
import { cn } from '@/utils/cn'

type Props = {
  cart: CartLike
  className?: string
  /** Se true mostra CTA checkout (es. pagina carrello). */
  showCheckoutCta?: boolean
  checkoutDisabled?: boolean
  noPurchasableLines?: boolean
  hasBlockedLines?: boolean
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11 V8 a4 4 0 0 1 8 0 v3" />
    </svg>
  )
}

const paymentBadges = [
  { id: 'visa', label: 'Visa', Logo: VisaLogo },
  { id: 'mastercard', label: 'Mastercard', Logo: MastercardLogo },
  { id: 'paypal', label: 'PayPal', Logo: PayPalLogo },
  { id: 'bonifico', label: 'Bonifico bancario', Logo: BonificoBancarioLogo },
] as const

export function CartSummary({
  cart,
  className,
  showCheckoutCta,
  checkoutDisabled,
  noPurchasableLines,
  hasBlockedLines,
}: Props) {
  const { t, tParams } = useI18n()
  const subtotal = cartSubtotalCents(cart)
  const tax = cartTaxCents(cart)
  const shipping = cartShippingCents(cart)
  const total = cartTotalCents(cart)
  const blocked = hasBlockedLines ?? cartHasBlockedLines(cart)
  const quoteDisabled = checkoutDisabled || blocked || noPurchasableLines
  const shippingFree = shipping === 0 || cart.freeShippingHint?.eligible === true
  const taxRate = cart.taxBreakdown?.taxRatePct ?? 22

  return (
    <aside className={cn('flex flex-col gap-4', className)}>
      <div className={cn(CART_CARD_SURFACE, 'p-[22px]')}>
        <h2 className="mb-4 text-base font-extrabold tracking-tight text-idl-graphite">
          {t('cart.summary.title')}
        </h2>

        <ProfessionalCartBanner className="mb-4" />

        <dl className="space-y-1 text-[13.5px] text-[#5b616b]">
          <div className="flex justify-between py-1">
            <dt>{t('cart.summary.subtotal')}</dt>
            <dd>{formatMoney(subtotal, cart.currencyCode)}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt>{t('cart.summary.shipping')}</dt>
            <dd className={shippingFree ? 'font-bold text-[#1f9d57]' : undefined}>
              {shippingFree ? t('cart.summary.shippingFree') : formatMoney(shipping, cart.currencyCode)}
            </dd>
          </div>
        </dl>

        <div className="mt-2 flex items-baseline justify-between border-t border-idl-tech-border pt-3.5">
          <span className="text-base font-extrabold text-idl-graphite">{t('cart.summary.total')}</span>
          <span className="text-[22px] font-extrabold text-idl-graphite">
            {formatMoney(total, cart.currencyCode)}
          </span>
        </div>

        {tax > 0 ? (
          <p className="mt-0.5 text-right text-[11.5px] text-[#9298a3]">
            {tParams('cart.summary.taxIncluded', {
              rate: taxRate,
              amount: formatMoney(tax, cart.currencyCode),
            })}
          </p>
        ) : (
          <p className="mt-0.5 text-right text-[11.5px] text-[#9298a3]">
            {t('cart.summary.estimatesDisclaimer')}
          </p>
        )}

        {showCheckoutCta ? (
          <div className="mt-[18px] space-y-3">
            {checkoutDisabled ? (
              <p className="text-center text-sm text-amber-800">
                {noPurchasableLines
                  ? t('cart.unpurchasable.noPurchasableLines')
                  : blocked
                    ? t('cart.unpurchasable.blockedCheckout')
                    : t('cart.stock.insufficient')}
              </p>
            ) : (
              <>
                <Link
                  to="/checkout"
                  className="block"
                  onMouseEnter={() => preloadStripe()}
                  onFocus={() => preloadStripe()}
                >
                  <Button
                    variant="technical"
                    className="h-auto w-full rounded-[10px] py-4 text-base font-extrabold"
                  >
                    {t('cart.checkoutCta')}
                  </Button>
                </Link>
              </>
            )}
            {quoteDisabled ? (
              <Button variant="secondary" className="w-full rounded-lg" disabled>
                {t('cart.quoteCta')}
              </Button>
            ) : (
              <Link to="/checkout/quote" className="block">
                <Button variant="secondary" className="w-full rounded-lg">
                  {t('cart.quoteCta')}
                </Button>
              </Link>
            )}
          </div>
        ) : null}

        {showCheckoutCta ? (
          <>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#9298a3]">
              <LockIcon />
              {t('cart.summary.securePayment')}
            </p>
            <div className="mt-3.5 flex flex-wrap justify-center gap-1.5">
              {paymentBadges.map(({ id, label, Logo }) => (
                <span
                  key={id}
                  className="flex h-8 items-center justify-center rounded bg-idl-tech-chip px-2"
                  role="img"
                  aria-label={label}
                  title={label}
                >
                  <Logo className={id === 'bonifico' ? 'h-[18px] text-idl-graphite' : 'h-5'} />
                </span>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </aside>
  )
}
