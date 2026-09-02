import { prisma } from '../lib/prisma.js'
import { syncSaleOrderFunnelState } from '../adapters/odoo/odooFunnelSync.js'
import { recordAbandonedCartEvent } from '../modules/cart/cart-contact.service.js'
import { orderTransactionalMail } from '../modules/orders/order-transactional-mail.service.js'

const ABANDONED_MAIL_STATUSES = ['CHECKOUT_STARTED', 'PAYMENT_STARTED'] as const

export async function processAbandonedCheckoutCandidates(
  olderThanMs = 1000 * 60 * 60 * 24,
): Promise<{ marked: number }> {
  const cutoff = new Date(Date.now() - olderThanMs)
  const candidates = await prisma.pwaOrder.findMany({
    where: {
      orderStatus: { in: [...ABANDONED_MAIL_STATUSES] },
      updatedAt: { lt: cutoff },
    },
  })

  let marked = 0
  for (const order of candidates) {
    const abandonedAt = new Date()
    const updated = await prisma.pwaOrder.update({
      where: { id: order.id },
      data: { orderStatus: 'ABANDONED', abandonedAt },
    })
    await prisma.cart.update({
      where: { id: order.cartId },
      data: { status: 'ABANDONED', abandonedAt },
    })
    await recordAbandonedCartEvent(order.cartId, 'checkout_timeout_abandoned', {
      orderId: order.id,
      olderThanMs,
    })
    await orderTransactionalMail.sendAbandonedCartReminder(updated, `abandoned-${order.id}`)
    await syncSaleOrderFunnelState(
      { correlationId: `abandoned-${order.id}` },
      updated.odooSaleOrderId,
      {
        pwaOrderId: updated.id,
        orderStatus: 'abandoned',
        paymentStatus: updated.paymentStatus.toLowerCase(),
        paymentMethod: updated.paymentMethod?.toLowerCase() ?? null,
        cartId: updated.cartId,
        sessionId: updated.sessionId,
        abandonedAt,
        lastPaymentError: updated.lastPaymentError,
        providerTransactionId: updated.providerTransactionId,
      },
    )
    marked += 1
  }

  return { marked }
}

export async function scheduleAbandonedCartProcessing(): Promise<{ marked: number }> {
  return processAbandonedCheckoutCandidates()
}
