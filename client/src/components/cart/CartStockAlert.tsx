'use client'

import type { CartStockInsufficientDTO } from '@/types/dto'
import { t } from '@/i18n/messages'
import type { PwaLocale } from '@/lib/locale'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

function displayName(line: CartStockInsufficientDTO) {
  return line.productName ?? line.productSlug ?? line.productRef
}

export function cartLineStockMessage(line: CartStockInsufficientDTO, locale: PwaLocale = 'IT') {
  const name = displayName(line)
  if (line.available <= 0) {
    return `${name}: ${t(locale, 'cart.stock.outOfStock')}`
  }
  return `${name}: ${t(locale, 'cart.stock.insufficient')}`
}

export function getCartStockIssue(
  productRef: string,
  issues: readonly CartStockInsufficientDTO[],
): CartStockInsufficientDTO | undefined {
  return issues.find((i) => i.productRef === productRef)
}

type CartLineStockAlertProps = {
  issue: CartStockInsufficientDTO
  className?: string
}

export function CartLineStockAlert({ issue, className }: CartLineStockAlertProps) {
  const { locale } = useI18n()

  return (
    <p
      role="alert"
      className={cn(
        'rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950',
        className,
      )}
    >
      {cartLineStockMessage(issue, locale)}
    </p>
  )
}

/** Alias per import legacy / HMR */
export { CartLineStockAlert as CartStockAlert }
