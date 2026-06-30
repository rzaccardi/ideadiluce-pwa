import {
  IDEADILUCE_CART_MIRROR_KEY,
  LEGACY_STORAGE_KEYS,
} from '@/lib/storage-keys'
import { readWithMigration, removeLegacyKeys } from '@/lib/storage-migrate'

export type LocalCartMirror = {
  cartId: string
  reservationExpiresAt: string | null
  updatedAt: string
}

const CART_MIRROR_LEGACY_KEYS = LEGACY_STORAGE_KEYS[IDEADILUCE_CART_MIRROR_KEY]

function clearLegacyStorage(): void {
  if (typeof window === 'undefined') return
  removeLegacyKeys(window.localStorage, CART_MIRROR_LEGACY_KEYS)
}

export function loadLocalCartMirror(): LocalCartMirror | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = readWithMigration(
      window.localStorage,
      IDEADILUCE_CART_MIRROR_KEY,
      CART_MIRROR_LEGACY_KEYS,
    )
    if (!raw) {
      clearLegacyStorage()
      return null
    }
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
  clearLegacyStorage()
  if (!cart) {
    window.localStorage.removeItem(IDEADILUCE_CART_MIRROR_KEY)
    return
  }
  const snapshot: LocalCartMirror = {
    cartId: cart.id,
    reservationExpiresAt: cart.reservation.expiresAt,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(IDEADILUCE_CART_MIRROR_KEY, JSON.stringify(snapshot))
}

export function clearLocalCartMirror(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(IDEADILUCE_CART_MIRROR_KEY)
  clearLegacyStorage()
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
