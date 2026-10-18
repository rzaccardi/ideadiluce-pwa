import { prisma } from '../../lib/prisma.js'
import { releaseShoppingCartAfterOrder } from './cart-release.service.js'

/**
 * Chiude (CONVERTED) i carrelli ACTIVE legati a un bonifico già PAYMENT_PENDING,
 * senza svuotare gli altri carrelli ACTIVE (usato al merge login).
 * Le righe restano sul carrello convertito per thank-you / storico ordine.
 */
export async function detachActiveCartsBoundToPendingBankTransfer(
  odooPartnerId: number,
): Promise<string[]> {
  const pendingOrders = await prisma.pwaOrder.findMany({
    where: {
      odooPartnerId,
      paymentMethod: 'BANK_TRANSFER',
      orderStatus: 'PAYMENT_PENDING',
    },
    select: { id: true, cartId: true, sessionId: true, odooPartnerId: true },
  })
  if (pendingOrders.length === 0) return []

  const detached: string[] = []
  for (const order of pendingOrders) {
    const cart = await prisma.cart.findUnique({
      where: { id: order.cartId },
      select: { id: true, status: true },
    })
    if (!cart || cart.status !== 'ACTIVE') continue
    await releaseShoppingCartAfterOrder({
      orderId: order.id,
      cartId: order.cartId,
      sessionId: order.sessionId,
      odooPartnerId: order.odooPartnerId,
      clearOtherActive: false,
    })
    detached.push(cart.id)
  }
  return detached
}

type ReleasePendingOptions = {
  /**
   * true (thank-you / confirm): chiude anche leftover ACTIVE.
   * false (shopping/checkout): solo CONVERTED sul carrello ordine, non tocca un carrello nuovo.
   */
  clearOtherActive?: boolean
}

/** Heal: chiude il carrello di un bonifico PAYMENT_PENDING. */
export async function releaseCartIfBankTransferPending(
  cartId: string,
  options?: ReleasePendingOptions,
): Promise<boolean> {
  const order = await prisma.pwaOrder.findFirst({
    where: {
      cartId,
      paymentMethod: 'BANK_TRANSFER',
      orderStatus: 'PAYMENT_PENDING',
    },
    select: { id: true, sessionId: true, odooPartnerId: true, cartId: true },
    orderBy: { updatedAt: 'desc' },
  })
  if (!order) return false

  await releaseShoppingCartAfterOrder({
    orderId: order.id,
    cartId: order.cartId,
    sessionId: order.sessionId,
    odooPartnerId: order.odooPartnerId,
    clearOtherActive: options?.clearOtherActive ?? false,
  })
  return true
}
