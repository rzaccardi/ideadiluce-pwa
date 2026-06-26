import type { Cart, CartItem } from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import { cartRepository } from './cart.repository.js'
import { recordAbandonedCartEvent } from './cart-contact.service.js'

export function isCartReservationEnabled(): boolean {
  return env.CART_RESERVATION_ENABLED && env.CART_RESERVATION_MINUTES > 0
}

export function cartReservationTtlMs(): number {
  return env.CART_RESERVATION_MINUTES * 60_000
}

async function clearReservationTotals(cartId: string) {
  await cartRepository.updateTotals(cartId, {
    estimatedSubtotal: null,
    estimatedTax: null,
    estimatedShipping: null,
    estimatedTotal: null,
    lastPricedAt: null,
  })
}

export async function clearExpiredReservation(cartId: string): Promise<void> {
  await recordAbandonedCartEvent(cartId, 'reservation_expired', {
    reason: 'cart_reservation_ttl',
  })
  await cartRepository.deleteItems(cartId)
  await clearReservationTotals(cartId)
  await prisma.cart.update({
    where: { id: cartId },
    data: {
      reservationStartedAt: null,
      reservationExpiresAt: null,
    },
  })
}

export async function expireCartIfNeeded(
  cart: Cart & { items: CartItem[] },
): Promise<{ cart: Cart & { items: CartItem[] }; expired: boolean }> {
  if (!isCartReservationEnabled() || cart.items.length === 0) {
    return { cart, expired: false }
  }
  if (!cart.reservationExpiresAt || cart.reservationExpiresAt > new Date()) {
    return { cart, expired: false }
  }

  await clearExpiredReservation(cart.id)
  const refreshed = await cartRepository.getWithItems(cart.id)
  return {
    cart: refreshed ?? { ...cart, items: [] },
    expired: true,
  }
}

export async function bumpCartReservation(cartId: string, hasItems: boolean): Promise<void> {
  if (!isCartReservationEnabled()) return

  if (!hasItems) {
    await prisma.cart.update({
      where: { id: cartId },
      data: { reservationStartedAt: null, reservationExpiresAt: null },
    })
    return
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + cartReservationTtlMs())
  const existing = await prisma.cart.findUnique({
    where: { id: cartId },
    select: { reservationStartedAt: true },
  })

  await prisma.cart.update({
    where: { id: cartId },
    data: {
      reservationStartedAt: existing?.reservationStartedAt ?? now,
      reservationExpiresAt: expiresAt,
    },
  })
}

export function buildCartReservationMeta(
  cart: Pick<Cart, 'reservationStartedAt' | 'reservationExpiresAt'>,
  expired: boolean,
) {
  const enabled = isCartReservationEnabled()
  const now = Date.now()
  const startedAt = cart.reservationStartedAt?.toISOString() ?? null
  const expiresAt = cart.reservationExpiresAt?.toISOString() ?? null
  const expiresInSeconds =
    expiresAt != null ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000)) : null
  const elapsedSeconds =
    startedAt != null ? Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000)) : null

  return {
    enabled,
    startedAt,
    expiresAt,
    expiresInSeconds,
    elapsedSeconds,
    expired,
    ttlMinutes: env.CART_RESERVATION_MINUTES,
  }
}
