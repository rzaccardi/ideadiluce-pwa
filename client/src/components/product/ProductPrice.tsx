'use client'

import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { formatMoney } from '@/lib/format'
import {
  formatCatalogMoney,
  resolveCatalogPriceDisplay,
  type CatalogPriceDisplay,
} from '@/lib/price-display'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

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
  layout?: 'stack' | 'inline'
  showCaption?: boolean
  className?: string
  amountClassName?: string
  captionClassName?: string
}

export function ProductPrice({
  netCents,
  currency,
  layout = 'stack',
  showCaption = true,
  className,
  amountClassName,
  captionClassName,
}: Props) {
  const { t } = useI18n()
  const display = useCatalogPriceDisplay(netCents)

  return (
    <span
      className={cn(
        layout === 'inline' ? 'inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5' : 'flex flex-col',
        className,
      )}
    >
      <span className={cn('tabular-nums', amountClassName)}>{formatMoney(display.cents, currency)}</span>
      {showCaption ? <span className={captionClassName}>{t(display.captionKey)}</span> : null}
    </span>
  )
}
