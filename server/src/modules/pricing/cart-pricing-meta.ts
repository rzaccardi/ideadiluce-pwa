/** Meta prezzi carrello (warnings Odoo, cache snapshot) — non persistito in DB. */

export type CartPricingMeta = {
  snapshotAt: string | null
  fromCache: boolean
  warnings: string[]
  needsConfirmation: boolean
  taxRatePct: number | null
  /** Snapshot già confermato dall’utente: non richiedere di nuovo finché non cambia. */
  acknowledgedSnapshotAt?: string | null
}

const byCartId = new Map<string, CartPricingMeta>()

export function setCartPricingMeta(cartId: string, meta: CartPricingMeta) {
  const prev = byCartId.get(cartId)
  const acknowledgedSnapshotAt = meta.acknowledgedSnapshotAt ?? prev?.acknowledgedSnapshotAt ?? null
  const needsConfirmation =
    meta.needsConfirmation &&
    !(acknowledgedSnapshotAt != null && acknowledgedSnapshotAt === meta.snapshotAt)
  byCartId.set(cartId, {
    ...meta,
    needsConfirmation,
    acknowledgedSnapshotAt,
  })
}

export function getCartPricingMeta(cartId: string): CartPricingMeta | null {
  return byCartId.get(cartId) ?? null
}

export function acknowledgeCartPricingConfirmation(cartId: string): CartPricingMeta | null {
  const prev = byCartId.get(cartId)
  if (!prev) return null
  const next: CartPricingMeta = {
    ...prev,
    needsConfirmation: false,
    acknowledgedSnapshotAt: prev.snapshotAt,
  }
  byCartId.set(cartId, next)
  return next
}

export function clearCartPricingMeta(cartId: string) {
  byCartId.delete(cartId)
}
