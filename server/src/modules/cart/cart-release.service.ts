import { prisma } from '../../lib/prisma.js'

type ReleaseShoppingCartInput = {
  orderId: string
  cartId: string
  sessionId: string | null
  odooPartnerId: number | null
  /** Default true: svuota gli altri ACTIVE. false = solo CONVERTED sul carrello ordine. */
  clearOtherActive?: boolean
}

/**
 * Chiude il carrello usato per l'ordine e (di default) svuota gli altri carrelli ACTIVE
 * della stessa sessione o dello stesso partner (es. carrello negozio rimasto
 * dopo un checkout da preventivo, che altrimenti riappare con le stesse righe).
 */
export async function releaseShoppingCartAfterOrder(input: ReleaseShoppingCartInput): Promise<void> {
  await prisma.cart.update({
    where: { id: input.cartId },
    data: { status: 'CONVERTED', convertedOrderId: input.orderId },
  })

  if (input.clearOtherActive === false) return

  const ownerOr: Array<{ sessionId: string } | { odooPartnerId: number }> = []
  if (input.sessionId) ownerOr.push({ sessionId: input.sessionId })
  if (input.odooPartnerId != null) ownerOr.push({ odooPartnerId: input.odooPartnerId })
  if (ownerOr.length === 0) return

  const leftovers = await prisma.cart.findMany({
    where: {
      id: { not: input.cartId },
      status: 'ACTIVE',
      OR: ownerOr,
    },
    select: { id: true },
  })
  if (leftovers.length === 0) return

  const ids = leftovers.map((cart) => cart.id)
  await prisma.cartItem.deleteMany({ where: { cartId: { in: ids } } })
  await prisma.cartShippingSelection.deleteMany({ where: { cartId: { in: ids } } })
  await prisma.cart.updateMany({
    where: { id: { in: ids } },
    data: {
      estimatedSubtotal: null,
      estimatedTax: null,
      estimatedShipping: null,
      estimatedTotal: null,
      lastPricedAt: null,
      reservationStartedAt: null,
      reservationExpiresAt: null,
    },
  })
}
