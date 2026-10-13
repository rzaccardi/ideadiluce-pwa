'use client'

import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { formatMoney } from '@/lib/format'
import {
  formatCatalogMoney,
  formatDiscountPctLabel,
  resolveCatalogPriceDisplay,
  shouldShowListPriceStrike,
  type CatalogPriceDisplay,
} from '@/lib/price-display'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import type { ProductPriceSourceDTO } from '@/types/dto'

export function useCatalogPriceDisplay(netCents: number): CatalogPriceDisplay {
  const auth = useSnapshot(authStore)
  return resolveCatalogPriceDisplay(netCents, auth.me, auth.impersonation)
}

export function useFormatCatalogMoney() {
  const auth = useSnapshot(authStore)
  return (netCents: number, currency: string) =>
    formatCatalogMoney(netCents, currency, auth.me, auth.impersonation)
}

type Props = {
  netCents: number
  currency: string
  listPriceCents?: number | null
  discountPct?: number | null
  priceSource?: ProductPriceSourceDTO | null
  layout?: 'stack' | 'inline'
  showCaption?: boolean
  className?: string
  amountClassName?: string
  captionClassName?: string
}

export function ProductPrice({
  netCents,
  currency,
  listPriceCents,
  discountPct,
  priceSource,
  layout = 'stack',
  showCaption = true,
  className,
  amountClassName,
  captionClassName,
}: Props) {
  const { t, tParams } = useI18n()
  const auth = useSnapshot(authStore)
  const display = resolveCatalogPriceDisplay(netCents, auth.me, auth.impersonation)
  const listDisplay = shouldShowListPriceStrike(netCents, listPriceCents)
    ? resolveCatalogPriceDisplay(listPriceCents!, auth.me, auth.impersonation)
    : null
  const showDiscountBadge = discountPct != null && discountPct > 0 && listDisplay != null

  return (
    <span
      className={cn(
        layout === 'inline' ? 'inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5' : 'flex flex-col',
        className,
      )}
    >
      <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={cn('tabular-nums', amountClassName)}>
          {formatMoney(display.cents, currency)}
        </span>
        {listDisplay ? (
          <span className="tabular-nums text-idl-muted line-through decoration-idl-muted/70">
            {formatMoney(listDisplay.cents, currency)}
          </span>
        ) : null}
        {showDiscountBadge ? (
          <span className="rounded-sm bg-idl-graphite/8 px-1.5 py-0.5 text-xs font-medium tabular-nums text-idl-graphite">
            {tParams('product.price.discountBadge', {
              pct: formatDiscountPctLabel(discountPct!),
            })}
          </span>
        ) : null}
      </span>
      {showCaption ? (
        <span className={captionClassName}>
          {priceSource === 'customer' ? t('product.price.customerReserved') : t(display.captionKey)}
        </span>
      ) : null}
    </span>
  )
}
