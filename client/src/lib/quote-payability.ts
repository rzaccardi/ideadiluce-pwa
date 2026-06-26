import type { QuoteRequestDTO, QuoteRequestStatusDTO } from '@/types/dto'
import type { MessageKey } from '@/i18n/messages'
import type { OrderStatusTone } from '@/lib/orderLabels'

export type QuotePayableReason = NonNullable<QuoteRequestDTO['payableReason']>

const QUOTE_STATUS_LABEL_KEYS: Record<QuoteRequestStatusDTO, MessageKey> = {
  requested: 'account.quotes.status.requested',
  sent: 'account.quotes.status.sent',
  checkout_started: 'account.quotes.status.checkout_started',
  converted: 'account.quotes.status.converted',
  draft: 'account.quotes.status.draft',
  cancelled: 'account.quotes.status.cancelled',
}

export function quoteStatusLabelKey(status: QuoteRequestStatusDTO): MessageKey {
  return QUOTE_STATUS_LABEL_KEYS[status] ?? 'account.quotes.status.requested'
}

export function quoteStatusTone(status: QuoteRequestStatusDTO): OrderStatusTone {
  if (status === 'converted') return 'success'
  if (status === 'cancelled') return 'danger'
  if (status === 'sent' || status === 'checkout_started') return 'success'
  if (status === 'requested' || status === 'draft') return 'warning'
  return 'neutral'
}

export function quoteDisplayReference(
  quote: Pick<QuoteRequestDTO, 'id' | 'odooReference' | 'odooSaleOrderId'>,
): string {
  if (quote.odooReference) return quote.odooReference
  if (quote.odooSaleOrderId) return `SO${quote.odooSaleOrderId}`
  return quote.id.slice(0, 8).toUpperCase()
}

export function isQuotePayable(quote: Pick<QuoteRequestDTO, 'payable' | 'status'>): boolean {
  return quote.payable ?? (quote.status === 'sent' || quote.status === 'checkout_started')
}

export function quotePayableMessageKey(
  quote: Pick<QuoteRequestDTO, 'payable' | 'payableReason' | 'expired' | 'status'>,
): MessageKey | null {
  if (quote.payable) return null
  if (quote.payableReason === 'expired' || quote.expired) return 'account.quotes.message.expired'
  if (quote.payableReason === 'cancelled') return 'account.quotes.message.cancelled'
  if (quote.payableReason === 'converted') return 'account.quotes.message.converted'
  if (quote.payableReason === 'draft') return 'account.quotes.message.draft'
  if (quote.payableReason === 'not_sent' || quote.status === 'requested') {
    return 'account.quotes.message.not_sent'
  }
  return 'account.quotes.message.notPayable'
}

export type QuotePayabilityBadge = 'payable' | 'expired' | 'pending' | 'preparing' | null

export function quotePayabilityBadge(
  quote: Pick<QuoteRequestDTO, 'payable' | 'payableReason' | 'expired' | 'status'>,
): QuotePayabilityBadge {
  if (quote.expired || quote.payableReason === 'expired') return 'expired'
  if (quote.payable) return 'payable'
  if (quote.payableReason === 'draft' || quote.status === 'draft') return 'preparing'
  if (quote.payableReason === 'not_sent' || quote.status === 'requested') return 'pending'
  if (quote.payableReason === 'cancelled' || quote.payableReason === 'converted') return null
  return 'pending'
}

const BADGE_LABEL_KEYS: Record<Exclude<QuotePayabilityBadge, null>, MessageKey> = {
  payable: 'account.quotes.badge.payable',
  expired: 'account.quotes.badge.expired',
  pending: 'account.quotes.badge.pending',
  preparing: 'account.quotes.badge.preparing',
}

export function quotePayabilityBadgeLabelKey(badge: QuotePayabilityBadge): MessageKey | null {
  if (!badge) return null
  return BADGE_LABEL_KEYS[badge]
}

export function quotePayabilityBadgeClass(badge: Exclude<QuotePayabilityBadge, null>): string {
  switch (badge) {
    case 'payable':
      return 'bg-emerald-100 text-emerald-900'
    case 'expired':
      return 'bg-amber-100 text-amber-900'
    case 'pending':
      return 'bg-sky-100 text-sky-900'
    case 'preparing':
      return 'bg-zinc-100 text-zinc-700'
  }
}

export function formatQuoteValidityDate(value: string | null | undefined, locale = 'it-IT'): string | null {
  if (!value?.trim()) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(locale)
}
