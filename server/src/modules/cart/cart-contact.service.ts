import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export type CartContactContext = {
  email: string | null
  odooPartnerId: number | null
}

export async function resolveCartContactContext(cartId: string): Promise<CartContactContext> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    select: {
      contactEmail: true,
      odooPartnerId: true,
      customer: { select: { email: true } },
      checkoutSessions: { orderBy: { updatedAt: 'desc' }, take: 1, select: { email: true } },
      pwaOrders: { orderBy: { updatedAt: 'desc' }, take: 1, select: { email: true } },
    },
  })
  if (!cart) return { email: null, odooPartnerId: null }

  const email =
    cart.customer?.email?.trim() ||
    cart.checkoutSessions[0]?.email?.trim() ||
    cart.pwaOrders[0]?.email?.trim() ||
    cart.contactEmail?.trim() ||
    null

  return {
    email: email ? email.toLowerCase() : null,
    odooPartnerId: cart.odooPartnerId,
  }
}

/** Aggiorna `Cart.contactEmail` quando conosciamo un'email. */
export async function syncCartContactEmail(cartId: string): Promise<CartContactContext> {
  const ctx = await resolveCartContactContext(cartId)
  if (ctx.email) {
    await prisma.cart.update({
      where: { id: cartId },
      data: { contactEmail: ctx.email },
    })
  }
  return ctx
}

type CartLineSnapshot = {
  productRef: string
  variantRef: string | null
  quantity: number
  unitEstimateCents: number | null
}

async function cartItemsSnapshot(cartId: string): Promise<CartLineSnapshot[]> {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    select: {
      productRef: true,
      variantRef: true,
      quantity: true,
      clientUnitPriceEstimate: true,
    },
  })
  return items.map((i) => ({
    productRef: i.productRef,
    variantRef: i.variantRef,
    quantity: i.quantity,
    unitEstimateCents: i.clientUnitPriceEstimate,
  }))
}

/** Registra evento abbandono/scadenza con email, partner e righe carrello (prima di svuotare). */
export async function recordAbandonedCartEvent(
  cartId: string,
  eventType: string,
  extraPayload?: Record<string, unknown>,
): Promise<void> {
  const [ctx, items] = await Promise.all([
    syncCartContactEmail(cartId),
    cartItemsSnapshot(cartId),
  ])

  const payload: Prisma.InputJsonValue = {
    ...(extraPayload ?? {}),
    itemCount: items.length,
  }

  await prisma.abandonedCartEvent.create({
    data: {
      cartId,
      eventType,
      contactEmail: ctx.email,
      odooPartnerId: ctx.odooPartnerId,
      itemsSnapshotJson: items.length > 0 ? items : undefined,
      payloadJson: payload,
    },
  })
}
