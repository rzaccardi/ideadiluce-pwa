import { loadLocalCartMirror } from '@/lib/cart-local-storage'
import type { CartDTO } from '@/types/dto'

/** Allineato al TTL server: reprice Odoo solo se i prezzi sono vecchi. */
export const CART_REPRICE_TTL_MS = 30 * 60 * 1000

function isOlderThan(iso: string | null | undefined, ttlMs: number): boolean {
  if (!iso) return true
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return true
  return Date.now() - ts > ttlMs
}

/**
 * Reprice Odoo solo quando serve: carrello recuperato, riserva scaduta, prezzi mancanti o vecchi.
 * Navigazione normale al carrello dopo add-to-cart → false (prezzi già aggiornati).
 */
export function shouldRepriceCartOnLoad(
  cart: CartDTO | null,
  options?: { reservationExpiredNotice?: boolean },
): boolean {
  if (options?.reservationExpiredNotice) return true

  if (!cart || cart.items.length === 0) {
    const mirror = loadLocalCartMirror()
    if (!mirror) return false
    return isOlderThan(mirror.updatedAt, CART_REPRICE_TTL_MS)
  }

  if (cart.reservation.expired) return true
  if (cart.items.some((line) => line.clientUnitPriceEstimateCents == null)) return true
  if (isOlderThan(cart.repricedAt, CART_REPRICE_TTL_MS)) return true

  return false
}
