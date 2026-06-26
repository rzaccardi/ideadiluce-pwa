'use client'

import { Link } from '@/lib/navigation'
import type { CartItemDTO, CartStockInsufficientDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { moveLineToWishlist, removeItem, updateItem } from '@/features/cart'
import { CartLineStockAlert, getCartStockIssue } from '@/components/cart/CartStockAlert'
import { CartLineThumb } from '@/components/cart/CartLineThumb'
import { CartQuantityStepper } from '@/components/cart/CartQuantityStepper'
import {
  cartLineAvailabilityToneClass,
  cartLineVariantChips,
  getCartLineAvailabilityDisplay,
} from '@/components/cart/cart-line-availability'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  line: CartItemDTO
  currencyCode: string
  stockInsufficient: ReadonlyArray<CartStockInsufficientDTO>
  isLoading: boolean
  isLast?: boolean
}

export function CartLineItem({ line, currencyCode, stockInsufficient, isLoading, isLast }: Props) {
  const { t, tParams } = useI18n()
  const stockIssue = getCartStockIssue(line.productRef, stockInsufficient)
  const blocked = line.availabilityStatus === 'blocked'
  const unpurchasable = blocked || line.purchasable === false
  const availability = getCartLineAvailabilityDisplay(line)
  const chips = cartLineVariantChips(line)
  const productHref = `/prodotto/${line.productSlug ?? line.productRef}`

  const unitPrice =
    line.clientUnitPriceEstimateCents != null
      ? formatMoney(line.clientUnitPriceEstimateCents, currencyCode)
      : t('common.notAvailable')

  const lineTotal =
    line.lineTotalEstimateCents != null
      ? formatMoney(line.lineTotalEstimateCents, currencyCode)
      : t('common.notAvailable')

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-5 sm:flex-row sm:gap-4 sm:p-[22px]',
        !isLast && 'border-b border-idl-tech-border/80',
        unpurchasable && 'opacity-80',
      )}
    >
      <div className="flex min-w-0 flex-1 gap-4">
        <Link to={productHref} className="shrink-0">
          <CartLineThumb
            imageUrl={line.imageUrl}
            name={line.productName}
            className="size-[84px] rounded-[9px]"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="mb-1 font-mono text-[10px] text-[#8b919b]">{line.productRef}</div>

          <div className="flex flex-wrap items-start gap-2">
            <Link
              to={productHref}
              className="text-[15px] font-bold leading-snug text-idl-graphite hover:underline"
            >
              {line.productName ?? line.productSlug ?? line.productRef}
            </Link>
            {unpurchasable ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                {blocked ? t('cart.unpurchasable.badge') : t('cart.unpurchasable.limitedBadge')}
              </span>
            ) : null}
            {line.priceChanged ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-900">
                {t('cart.priceUpdated')}
              </span>
            ) : null}
          </div>

          {chips.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded bg-idl-tech-chip px-[7px] py-[3px] font-mono text-[10px] text-idl-graphite-2"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          <p
            className={cn(
              'mt-2 text-xs font-bold',
              cartLineAvailabilityToneClass(availability.tone),
            )}
          >
            ●{' '}
            {availability.params
              ? tParams(availability.messageKey, availability.params)
              : t(availability.messageKey)}
          </p>

          {blocked ? (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-idl-graphite underline-offset-2 hover:underline"
              disabled={isLoading}
              onClick={() => void moveLineToWishlist(line)}
            >
              {t('cart.unpurchasable.moveToWishlist')}
            </button>
          ) : null}

          {line.availability.warning ? (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
            >
              {line.availability.warning}
            </p>
          ) : null}

          {stockIssue ? (
            <div className="mt-3">
              <CartLineStockAlert issue={stockIssue} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:w-[168px] sm:shrink-0 sm:flex-col sm:items-end sm:justify-between">
        <div
          className={cn(
            'text-base font-extrabold text-idl-graphite sm:text-right',
            unpurchasable && 'text-idl-muted line-through',
          )}
        >
          {lineTotal}
          <div className="mt-0.5 text-[11px] font-normal text-idl-muted sm:hidden">
            {unitPrice} {t('cart.perUnit')}
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <CartQuantityStepper
            value={line.quantity}
            disabled={unpurchasable || isLoading}
            onChange={(quantity) => void updateItem(line.id, quantity)}
          />
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void removeItem(line.id)}
            className="text-[12.5px] text-[#9298a3] transition hover:text-idl-graphite disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('cart.remove')}
          </button>
        </div>
      </div>
    </div>
  )
}
