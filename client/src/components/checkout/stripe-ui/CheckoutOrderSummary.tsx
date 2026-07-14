'use client'

import { useState } from 'react'
import { useNavigate } from '@/lib/navigation'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { CartDTO, CartItemDTO, FreeShippingHintDTO, ProductCardDTO, ShippingQuoteDTO, TaxBreakdownDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { cartSubtotalCents, cartTaxCents, cartTotalCents } from '@/lib/cartTotals'
import { isDev } from '@/lib/env'
import { cn } from '@/utils/cn'
import { FreeShippingNudge } from '@/components/cart/FreeShippingNudge'
import { BrandWordmark } from '@/components/site/primitives'
import { CheckoutCrossSellSection } from '@/components/checkout/CheckoutCrossSellSection'
import { CheckoutTrustSignals } from '@/components/checkout/stripe-ui/CheckoutTrustSignals'
import { CheckoutLegalLinks } from '@/components/checkout/stripe-ui/CheckoutLegalLinks'
import {
  CHECKOUT_STORE_NAME,
  checkoutMobileSummaryClass,
  checkoutMobileSummaryPanelClass,
  checkoutMobileSummarySpacerClass,
  checkoutSummaryAsideClass,
  checkoutSummaryInnerClass,
  checkoutTitleTypographyClass,
} from './constants'
import { CartLineThumb } from '@/components/cart/CartLineThumb'
import { CartRemoveButton } from '@/components/cart/CartRemoveButton'
import { ViewportPortal } from '@/components/ViewportPortal'
import { useI18n } from '@/hooks/use-i18n'

type CartLike = Omit<CartDTO, 'items' | 'warnings'> & {
  items: ReadonlyArray<CartItemDTO>
  warnings?: ReadonlyArray<string>
}

type SummaryTheme = 'light' | 'dark'

type Props = {
  cart: CartLike
  selectedShipping: ShippingQuoteDTO | null
  freeShippingHint?: FreeShippingHintDTO | null
  taxBreakdown?: TaxBreakdownDTO | null
  mobileOnly?: boolean
  onRemoveItem?: (itemId: string) => void
  removeDisabled?: boolean
  recommendations?: ReadonlyArray<ProductCardDTO>
  recommendationsLoading?: boolean
  onCrossSellAdded?: () => void
}

const summaryThemeClasses = {
  light: {
    itemTitle: 'text-idl-graphite',
    itemMeta: 'text-idl-muted',
    row: 'text-idl-graphite',
    rowMuted: 'text-idl-muted',
    border: 'border-idl-tech-chip-border',
    qtyBadge: 'bg-[#3a332a] text-[#f1e8d8]',
    thumbBorder: 'border-idl-tech-border',
  },
  dark: {
    itemTitle: 'text-[#f1e8d8]',
    itemMeta: 'text-[#b0b0b4]',
    row: 'text-[#f1e8d8]',
    rowMuted: 'text-[#b0b0b4]',
    border: 'border-white/10',
    qtyBadge: 'bg-[#3a332a] text-[#f1e8d8]',
    thumbBorder: 'border-white/10',
  },
} as const

function SummaryContent({
  cart,
  selectedShipping,
  freeShippingHint,
  taxBreakdown,
  theme = 'light',
  onRemoveItem,
  removeDisabled = false,
  recommendations = [],
  recommendationsLoading = false,
  onCrossSellAdded,
}: Omit<Props, 'mobileOnly'> & { theme?: SummaryTheme }) {
  const { t } = useI18n()
  const tTheme = summaryThemeClasses[theme]
  const subtotal = taxBreakdown?.netCents ?? cartSubtotalCents(cart)
  const tax = cartTaxCents(cart, taxBreakdown)
  const total = cartTotalCents(cart, selectedShipping?.amountCents, taxBreakdown)
  const shippingDisplay =
    selectedShipping?.amountCents ?? (cart.estimatedShipping != null && cart.estimatedShipping > 0 ? cart.estimatedShipping : null)

  return (
    <>
      <div className="space-y-5">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-3 sm:gap-3.5">
            <div className="relative shrink-0">
              <CartLineThumb
                imageUrl={item.imageUrl}
                name={item.productName}
                className={cn('rounded-[9px]', tTheme.thumbBorder)}
              />
              <span
                className={cn(
                  'absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-[11px] font-bold',
                  tTheme.qtyBadge,
                )}
              >
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className={cn('line-clamp-2 text-sm font-semibold leading-snug', tTheme.itemTitle)}>
                {item.productName ?? item.productRef}
              </p>
              {item.quantity > 1 && item.lineTotalEstimateCents != null ? (
                <p className={cn('mt-0.5 text-xs', tTheme.itemMeta)}>
                  {formatMoney(
                    Math.round(item.lineTotalEstimateCents / item.quantity),
                    cart.currencyCode,
                  )}{' '}
                  {t('cart.perUnit')}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-start gap-1">
              <p className={cn('text-sm font-semibold tabular-nums', tTheme.itemTitle)}>
                {item.lineTotalEstimateCents != null
                  ? formatMoney(item.lineTotalEstimateCents, cart.currencyCode)
                  : t('common.notAvailable')}
              </p>
              {onRemoveItem ? (
                <CartRemoveButton
                  theme={theme}
                  disabled={removeDisabled}
                  onClick={() => onRemoveItem(item.id)}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <CheckoutCrossSellSection
        products={recommendations}
        isLoading={recommendationsLoading}
        theme={theme}
        onAdded={onCrossSellAdded}
      />

      <FreeShippingNudge
        hint={freeShippingHint ?? cart.freeShippingHint}
        currencyCode={cart.currencyCode}
        className="mt-4"
      />

      <dl className={cn('mt-6 space-y-2.5 border-t pt-5 text-sm', tTheme.border)}>
        <div className={cn('flex justify-between', tTheme.row)}>
          <dt>{t('checkout.summary.subtotal')}</dt>
          <dd className="tabular-nums">{formatMoney(subtotal, cart.currencyCode)}</dd>
        </div>
        <div className={cn('flex justify-between', tTheme.row)}>
          <dt>{taxBreakdown?.taxLabel ?? t('checkout.summary.tax')}</dt>
          <dd className="tabular-nums">{formatMoney(tax, cart.currencyCode)}</dd>
        </div>
        <div className={cn('flex justify-between gap-4', tTheme.row)}>
          <dt className="min-w-0">
            <span>{t('checkout.summary.shipping')}</span>
            {selectedShipping ? (
              <span className={cn('mt-0.5 block text-xs', tTheme.rowMuted)}>{selectedShipping.label}</span>
            ) : null}
          </dt>
          <dd className="shrink-0 tabular-nums">
            {shippingDisplay != null
              ? shippingDisplay === 0
                ? t('checkout.summary.free')
                : formatMoney(shippingDisplay, cart.currencyCode)
              : t('common.notAvailable')}
          </dd>
        </div>
      </dl>

      <div
        className={cn(
          'mt-4 flex justify-between border-t pt-4 text-base font-extrabold tracking-tight',
          tTheme.border,
          tTheme.row,
        )}
      >
        <span>{t('checkout.summary.total')}</span>
        <span className="tabular-nums">{formatMoney(total, cart.currencyCode)}</span>
      </div>
    </>
  )
}

export function CheckoutOrderSummary({
  cart,
  selectedShipping,
  freeShippingHint,
  taxBreakdown,
  mobileOnly,
  onRemoveItem,
  removeDisabled,
  recommendations = [],
  recommendationsLoading = false,
  onCrossSellAdded,
}: Props) {
  const { t, tParams } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)
  const total = cartTotalCents(cart, selectedShipping?.amountCents, taxBreakdown)

  if (mobileOnly) {
    const mobileToggle = (
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="relative z-10 flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5 sm:py-3.5"
        aria-expanded={mobileOpen}
      >
        <span className="flex min-w-0 items-center gap-2 text-sm text-idl-graphite underline decoration-idl-muted/50 underline-offset-2">
          <ChevronIcon open={mobileOpen} />
          <span className="truncate">
            {mobileOpen ? t('checkout.summary.hideOrderSummary') : t('checkout.summary.showOrderSummary')}
          </span>
        </span>
        <span className="shrink-0 text-base font-bold tabular-nums text-idl-graphite">
          {formatMoney(total, cart.currencyCode)}
        </span>
      </button>
    )

    return (
      <>
        <div className={checkoutMobileSummarySpacerClass} aria-hidden />
        <div
          className={cn(checkoutMobileSummaryClass, mobileOpen && 'pointer-events-none invisible')}
          aria-hidden={mobileOpen}
        >
          {mobileToggle}
        </div>
        <ViewportPortal open={mobileOpen} lockScroll>
          <button
            type="button"
            className="fixed inset-0 z-[60] h-[100dvh] w-screen bg-[rgba(22,19,13,0.35)] lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label={t('checkout.summary.hideOrderSummary')}
          />
          <div className={cn(checkoutMobileSummaryClass, 'z-[70] shadow-[0_16px_48px_rgba(0,0,0,0.14)]')}>
            {mobileToggle}
            <div className={checkoutMobileSummaryPanelClass}>
              <div className="px-4 pb-5 pt-4 sm:px-5">
                <SummaryContent
                  cart={cart}
                  selectedShipping={selectedShipping}
                  freeShippingHint={freeShippingHint}
                  taxBreakdown={taxBreakdown}
                  onRemoveItem={onRemoveItem}
                  removeDisabled={removeDisabled}
                  recommendations={recommendations}
                  recommendationsLoading={recommendationsLoading}
                  onCrossSellAdded={onCrossSellAdded}
                />
              </div>
            </div>
          </div>
        </ViewportPortal>
      </>
    )
  }

  return (
    <aside className={checkoutSummaryAsideClass}>
      <div className={checkoutSummaryInnerClass}>
        <CheckoutSummaryHeader theme="dark" />
        <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#b0b0b4]">
          {tParams('checkout.payStore', { store: CHECKOUT_STORE_NAME })}
        </p>
        <p className={cn(checkoutTitleTypographyClass, 'mt-1 font-serif text-2xl font-semibold text-[#f1e8d8] sm:text-[28px]')}>
          {formatMoney(total, cart.currencyCode)}
        </p>
        <div className="mt-8 flex-1">
          <SummaryContent
            cart={cart}
            selectedShipping={selectedShipping}
            freeShippingHint={freeShippingHint}
            taxBreakdown={taxBreakdown}
            theme="dark"
            onRemoveItem={onRemoveItem}
            removeDisabled={removeDisabled}
            recommendations={recommendations}
            recommendationsLoading={recommendationsLoading}
            onCrossSellAdded={onCrossSellAdded}
          />
        </div>
        <CheckoutSummaryFooter theme="dark" cartItems={cart.items} />
      </div>
    </aside>
  )
}

export function CheckoutBackButton({
  theme = 'light',
  backHref = '/cart',
  backLabel,
  className,
}: {
  theme?: SummaryTheme
  backHref?: string
  backLabel?: string
  className?: string
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const lp = useLocalePath()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const label = backLabel ?? t('checkout.backToCart')
  const dark = theme === 'dark'
  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={cn(
          'flex size-[38px] shrink-0 items-center justify-center rounded-full border transition',
          dark
            ? 'border-white/15 text-[#f1e8d8] hover:bg-white/10'
            : 'border-[#e2e6eb] text-[#14161b] hover:bg-black/5',
          className,
        )}
        aria-label={label}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M10 3 5 8l5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={t('checkout.backToCartConfirmTitle')}
        description={t('checkout.backToCartConfirmDescription')}
        confirmLabel={t('checkout.backToCart')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          navigate(lp(backHref))
        }}
      />
    </>
  )
}

export function CheckoutSummaryHeader({
  theme = 'light',
  backHref = '/cart',
  backLabel,
  showBack = true,
  className,
}: {
  theme?: SummaryTheme
  backHref?: string
  backLabel?: string
  showBack?: boolean
  className?: string
}) {
  const { t } = useI18n()
  const label = backLabel ?? t('checkout.backToCart')
  const dark = theme === 'dark'

  return (
    <div className={cn('flex min-w-0 items-center gap-2 sm:gap-3.5', className)}>
      {showBack ? (
        <CheckoutBackButton theme={theme} backHref={backHref} backLabel={label} />
      ) : null}
      <BrandWordmark
        className={cn(
          'min-w-0 text-lg sm:text-[21px]',
          dark ? 'text-white' : 'text-[#14161b]',
        )}
        accentClassName="text-[#c9a24b]"
      />
      <span
        className={cn(
          'ml-auto shrink-0 rounded-[5px] px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.05em] sm:px-2 sm:py-1 sm:text-[10px]',
          'bg-[#c9a24b] text-[#0c0c0d]',
        )}
      >
        {t('checkout.summary.secureBadge')}
      </span>
      {isDev() ? (
        <span className="shrink-0 rounded bg-[#c9a24b] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0c0c0d] sm:text-[10px]">
          Test
        </span>
      ) : null}
    </div>
  )
}

export function CheckoutSummaryFooter({
  theme = 'light',
  cartItems,
}: {
  theme?: SummaryTheme
  cartItems?: ReadonlyArray<Pick<CartItemDTO, 'productSlug' | 'productName'>>
}) {
  return (
    <footer className="mt-8 space-y-4">
      <CheckoutTrustSignals theme={theme} cartItems={cartItems} />
      <CheckoutLegalLinks theme={theme} />
    </footer>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={cn('transition-transform', open && 'rotate-180')}
      aria-hidden
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function checkoutTotalCents(
  cart: CartLike,
  selectedShipping: ShippingQuoteDTO | null,
  taxBreakdown?: TaxBreakdownDTO | null,
) {
  return cartTotalCents(cart, selectedShipping?.amountCents, taxBreakdown)
}
