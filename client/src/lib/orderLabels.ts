import { t, type MessageKey } from '@/i18n/messages'
import type { PwaLocale } from '@/lib/locale'

const ORDER_STATUS_KEYS: Record<string, MessageKey> = {
  cart_created: 'orderStatus.cart_created',
  checkout_started: 'orderStatus.checkout_started',
  payment_started: 'orderStatus.payment_started',
  payment_pending: 'orderStatus.payment_pending',
  paid: 'orderStatus.paid',
  paid_sync_pending: 'orderStatus.paid_sync_pending',
  synced: 'orderStatus.synced',
  payment_failed: 'orderStatus.payment_failed',
  abandoned: 'orderStatus.abandoned',
  cancelled: 'orderStatus.cancelled',
  confirmed: 'orderStatus.confirmed',
  completed: 'orderStatus.completed',
}

const PAYMENT_STATUS_KEYS: Record<string, MessageKey> = {
  not_started: 'paymentStatus.not_started',
  created: 'paymentStatus.created',
  pending: 'paymentStatus.pending',
  captured: 'paymentStatus.captured',
  failed: 'paymentStatus.failed',
  cancelled: 'paymentStatus.cancelled',
  refunded: 'paymentStatus.refunded',
}

export function orderStatusLabel(status: string, locale: PwaLocale = 'IT'): string {
  const key = ORDER_STATUS_KEYS[status.toLowerCase()]
  return key ? t(locale, key) : status
}

export function paymentStatusLabel(
  status: string | null | undefined,
  locale: PwaLocale = 'IT',
): string {
  if (!status) return t(locale, 'common.notAvailable')
  const key = PAYMENT_STATUS_KEYS[status.toLowerCase()]
  return key ? t(locale, key) : status
}

export function formatOrderRef(odooSaleOrderId: number, locale: PwaLocale = 'IT'): string {
  const prefix =
    locale === 'EN'
      ? 'Order'
      : locale === 'ES'
        ? 'Pedido'
        : locale === 'FR'
          ? 'Commande'
          : locale === 'DE'
            ? 'Bestellung'
            : 'Ordine'
  return `${prefix} #${odooSaleOrderId}`
}

export type OrderStatusTone = 'success' | 'warning' | 'danger' | 'neutral'

export function orderStatusTone(status: string): OrderStatusTone {
  const key = status.toLowerCase()
  if (['paid', 'paid_sync_pending', 'synced', 'confirmed', 'completed'].includes(key)) return 'success'
  if (['payment_pending', 'payment_started', 'checkout_started'].includes(key)) return 'warning'
  if (['payment_failed', 'cancelled', 'abandoned'].includes(key)) return 'danger'
  return 'neutral'
}

export function paymentStatusTone(status: string | null | undefined): OrderStatusTone {
  if (!status) return 'neutral'
  const key = status.toLowerCase()
  if (key === 'captured') return 'success'
  if (['pending', 'created', 'not_started'].includes(key)) return 'warning'
  if (['failed', 'cancelled'].includes(key)) return 'danger'
  return 'neutral'
}
