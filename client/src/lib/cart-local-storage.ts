const STORAGE_KEY = 'emil_cart_mirror_v1'
const LEGACY_STORAGE_KEY = 'emil_cart_v1'

export type LocalCartMirror = {
  cartId: string
  reservationExpiresAt: string | null
  updatedAt: string
}

function clearLegacyStorage(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export function loadLocalCartMirror(): LocalCartMirror | null {
  if (typeof window === 'undefined') return null
  clearLegacyStorage()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalCartMirror
    if (!parsed?.cartId) return null
    return parsed
  } catch {
    return null
  }
}

export function saveLocalCartMirror(cart: {
  id: string
  reservation: { expiresAt: string | null }
} | null): void {
  if (typeof window === 'undefined') return
  if (!cart) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  const snapshot: LocalCartMirror = {
    cartId: cart.id,
    reservationExpiresAt: cart.reservation.expiresAt,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function clearLocalCartMirror(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

/** @deprecated Mirror legacy guest items — migrato a cartId + reservationExpiresAt. */
export function loadLocalCart(): null {
  return null
}

/** @deprecated */
export function saveLocalCart(_items: unknown[]): void {
  /* no-op: server è source of truth */
}

/** @deprecated */
export function clearLocalCart(): void {
  clearLocalCartMirror()
}

/** @deprecated */
export function cartToLocalItems(): never[] {
  return []
}
