import type { PwaOrderStatus, PwaPaymentMethod } from '@prisma/client'

const PAID_OR_CLOSED_STATUSES: PwaOrderStatus[] = [
  'PAID',
  'PAID_SYNC_PENDING',
  'SYNCED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
]

export function isBankTransferAwaitingPayment(order: {
  paymentMethod: PwaPaymentMethod | null
  orderStatus: PwaOrderStatus | string
}): boolean {
  return order.paymentMethod === 'BANK_TRANSFER' && order.orderStatus === 'PAYMENT_PENDING'
}

/** Stripe return/finalize must not overwrite a bonifico già confermato o un ordine già chiuso. */
export function canStripeReturnMutateOrder(order: {
  paymentMethod: PwaPaymentMethod | null
  orderStatus: PwaOrderStatus | string
}): boolean {
  if (order.paymentMethod === 'BANK_TRANSFER') return false
  return !PAID_OR_CLOSED_STATUSES.includes(order.orderStatus as PwaOrderStatus)
}

/** Una sessione Stripe in volo non deve sostituire un bonifico già registrato. */
export function shouldRejectIncomingPaymentMethod(
  order: {
    paymentMethod: PwaPaymentMethod | null
    orderStatus: PwaOrderStatus | string
  },
  incomingMethod: PwaPaymentMethod,
): boolean {
  if (order.paymentMethod === incomingMethod) return false
  if (isBankTransferAwaitingPayment(order)) return true
  return PAID_OR_CLOSED_STATUSES.includes(order.orderStatus as PwaOrderStatus)
}
