import type { PwaOrder, PwaOrderStatus } from '@prisma/client'

const CACHEABLE_STATUSES: PwaOrderStatus[] = [
  'PAYMENT_PENDING',
  'PAYMENT_FAILED',
  'PAID',
  'PAID_SYNC_PENDING',
  'SYNCED',
  'CONFIRMED',
  'COMPLETED',
]

export function orderCacheFieldsForPwaOrder(
  po: Pick<PwaOrder, 'odooSaleOrderId' | 'orderStatus' | 'paymentStatus'>,
): { status: string; paymentStatus: string } | null {
  if (!po.odooSaleOrderId) return null
  if (!CACHEABLE_STATUSES.includes(po.orderStatus)) return null
  if (po.orderStatus === 'PAYMENT_PENDING') {
    return { status: 'payment_pending', paymentStatus: po.paymentStatus.toLowerCase() }
  }
  if (po.orderStatus === 'PAYMENT_FAILED') {
    return { status: 'payment_failed', paymentStatus: 'failed' }
  }
  return { status: 'sale', paymentStatus: 'paid' }
}
