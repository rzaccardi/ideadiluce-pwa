import { t, type MessageKey } from '@/i18n/messages'
import type { PwaLocale } from '@/lib/locale'
import type { OrderStatusTone } from '@/lib/orderLabels'

const INVOICE_STATE_KEYS: Record<string, MessageKey> = {
  posted: 'account.invoices.state.posted',
  draft: 'account.invoices.state.draft',
  cancel: 'account.invoices.state.cancel',
}

export function invoiceStateTone(state: string): OrderStatusTone {
  const key = state.toLowerCase()
  if (key === 'posted' || key === 'paid') return 'success'
  if (key === 'draft') return 'warning'
  if (key === 'cancel') return 'danger'
  return 'neutral'
}

export function invoiceStateLabel(state: string, locale: PwaLocale = 'IT'): string {
  const key = INVOICE_STATE_KEYS[state.toLowerCase()]
  return key ? t(locale, key) : state
}

/** Odoo `account.move.payment_state === 'paid'`. */
export function invoiceIsPaid(paymentState: string | null | undefined): boolean {
  return (paymentState ?? '').toLowerCase() === 'paid'
}

export function invoicePaymentLabel(
  paymentState: string | null | undefined,
  locale: PwaLocale = 'IT',
): string | null {
  if (!paymentState?.trim()) return null
  return invoiceIsPaid(paymentState)
    ? t(locale, 'account.invoices.payment.paid')
    : t(locale, 'account.invoices.payment.unpaid')
}

export function invoicePaymentTone(paymentState: string | null | undefined): OrderStatusTone {
  return invoiceIsPaid(paymentState) ? 'success' : 'danger'
}
