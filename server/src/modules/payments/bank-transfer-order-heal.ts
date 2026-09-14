import { prisma } from '../../lib/prisma.js'

/**
 * Se una sessione Stripe non pagata ha marcato fallito un ordine già confermato
 * con bonifico, ripristina lo stato pending con istruzioni di pagamento.
 */
export async function healBankTransferFalselyMarkedFailed(orderId: string): Promise<boolean> {
  const order = await prisma.pwaOrder.findUnique({
    where: { id: orderId },
    include: { payments: { orderBy: { createdAt: 'desc' } } },
  })
  if (!order) return false
  if (order.paymentMethod !== 'BANK_TRANSFER') return false
  if (order.orderStatus !== 'PAYMENT_FAILED' && order.paymentStatus !== 'FAILED') return false

  const bankTransfer = order.payments.find(
    (payment) =>
      payment.method === 'BANK_TRANSFER' &&
      (payment.status === 'PENDING' || payment.status === 'CREATED'),
  )
  if (!bankTransfer) return false

  await prisma.pwaOrder.update({
    where: { id: order.id },
    data: {
      orderStatus: 'PAYMENT_PENDING',
      paymentStatus: 'PENDING',
      lastPaymentError: null,
    },
  })
  return true
}
