'use client'

import { useI18n } from '@/hooks/use-i18n'
import type { QuoteRequestDTO } from '@/types/dto'
import {
  quotePayabilityBadge,
  quotePayabilityBadgeClass,
  quotePayabilityBadgeLabelKey,
  quotePayableMessageKey,
} from '@/lib/quote-payability'
import { cn } from '@/utils/cn'

type QuotePayabilityFields = Pick<
  QuoteRequestDTO,
  'payable' | 'payableReason' | 'expired' | 'validityDate' | 'status'
>

type Props = {
  quote: QuotePayabilityFields
  className?: string
}

export function QuoteStatusBadges({ quote, className }: Props) {
  const { t } = useI18n()
  const badge = quotePayabilityBadge(quote)
  const labelKey = quotePayabilityBadgeLabelKey(badge)

  if (!badge || !labelKey) return null

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        quotePayabilityBadgeClass(badge),
        className,
      )}
    >
      {t(labelKey)}
    </span>
  )
}

export function QuotePayabilityNotice({
  quote,
  className,
}: {
  quote: Pick<QuoteRequestDTO, 'payable' | 'payableReason' | 'expired' | 'status'>
  className?: string
}) {
  const { t } = useI18n()
  const key = quotePayableMessageKey(quote)
  if (!key || quote.payable) return null

  return (
    <p
      className={cn(
        'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950',
        className,
      )}
    >
      {t(key)}
    </p>
  )
}

export function QuoteValidityHint({
  quote,
  className,
}: {
  quote: Pick<QuoteRequestDTO, 'validityDate' | 'expired' | 'payable'>
  className?: string
}) {
  const { t } = useI18n()
  if (!quote.validityDate) return null

  const formatted = new Date(quote.validityDate).toLocaleDateString('it-IT')
  if (Number.isNaN(new Date(quote.validityDate).getTime())) return null

  return (
    <p className={cn('text-xs text-[#6c727c]', className)}>
      {t('account.quotes.validUntil')} {formatted}
      {quote.expired ? ` · ${t('account.quotes.badge.expired')}` : null}
    </p>
  )
}
