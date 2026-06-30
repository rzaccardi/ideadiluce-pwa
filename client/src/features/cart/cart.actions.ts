import { api } from '@/api/endpoints'
import { dedupeAsync, invalidateDedupePrefix } from '@/lib/async-cache'
import {
  clearLocalCartMirror,
  loadLocalCartMirror,
  saveLocalCartMirror,
} from '@/lib/cart-local-storage'
import { ApiRequestError } from '@/types/api'
import type { CartAddedFeedback } from './cart-feedback'
import { notifyCartItemAdded } from './cart-feedback'
import type { CartAddProductHint } from './cart-add-hint'
import { cartStore } from './cart.store'

export type AddItemOptions = {
  feedback?: CartAddedFeedback
  productHint?: CartAddProductHint
}

function normalizeAddItemOptions(
  options?: AddItemOptions | CartAddedFeedback,
): AddItemOptions {
  if (!options) return {}
  if ('productHint' in options) return options
  if ('productName' in options) return { feedback: options }
  return options
}

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore carrello'
}

function mirrorCartToLocalStorage() {
  saveLocalCartMirror(cartStore.cart)
}

function detectStaleCartMirror(serverCartId: string): boolean {
  const mirror = loadLocalCartMirror()
  if (!mirror) return false
  return mirror.cartId !== serverCartId
}

/** Dopo login/logout: evita di mostrare il carrello guest in cache mentre si ricarica quello server. */
export function resetCartForAuthChange() {
  invalidateDedupePrefix('cart:')
  cartStore.cart = null
  cartStore.recommendations = []
  cartStore.stockInsufficient = []
  cartStore.reservationExpiredNotice = false
  cartStore.error = null
}

// Source of truth: session cookie server-side. Il mirror `ideadiluce:cart-mirror:v1` salva solo
// cartId + scadenza riserva (vedi cart-local-storage). POST /cart/sync-from-client resta
// legacy per sync righe guest e non viene invocato dal client.
async function loadCart(options?: { skipMirrorCheck?: boolean; reprice?: boolean; silent?: boolean }) {
  if (!options?.silent) cartStore.isLoading = true
  cartStore.error = null
  try {
    const next = await api.cart.get({ reprice: options?.reprice })
    if (!options?.skipMirrorCheck && detectStaleCartMirror(next.id)) {
      cartStore.reservationExpiredNotice = true
    }
    if (next.reservation.expired) {
      cartStore.reservationExpiredNotice = true
      cartStore.recommendations = []
      cartStore.stockInsufficient = []
    }
    cartStore.cart = next
    mirrorCartToLocalStorage()
  } catch (e) {
    cartStore.error = errMessage(e)
  } finally {
    if (!options?.silent) cartStore.isLoading = false
  }
}

export type FetchCartOptions = {
  /** Forza una nuova richiesta anche se il carrello è già in memoria. */
  force?: boolean
  /** Salta controllo mirror localStorage (es. dopo mutazione già sincronizzata). */
  skipMirrorCheck?: boolean
  /** Richiede reprice Odoo lato server (cart/checkout). */
  reprice?: boolean
  /** Non mostrare lo stato di caricamento globale del carrello. */
  silent?: boolean
}

type MergedCartFetch = Pick<FetchCartOptions, 'skipMirrorCheck' | 'reprice' | 'silent'>

let pendingCartFetch: MergedCartFetch | null = null

function queueCartFetchOptions(options?: FetchCartOptions) {
  const prev = pendingCartFetch ?? {}
  pendingCartFetch = {
    skipMirrorCheck: prev.skipMirrorCheck || options?.skipMirrorCheck,
    reprice: prev.reprice || options?.reprice,
    silent: Boolean(prev.silent && options?.silent),
  }
}

export function fetchCart(options?: FetchCartOptions) {
  if (!options?.force && cartStore.cart) {
    return Promise.resolve()
  }
  queueCartFetchOptions(options)
  // Chiave unica: evita GET paralleli cart + cart?reprice=1 (stesso carrello, doppio Odoo).
  return dedupeAsync('cart:get', async () => {
    await Promise.resolve()
    const opts = pendingCartFetch ?? {}
    pendingCartFetch = null
    return loadCart(opts)
  })
}

/** Verifica mirror localStorage al bootstrap (prima del primo GET). */
export async function bootstrapCartSync(): Promise<boolean> {
  const mirror = loadLocalCartMirror()
  return mirror != null
}

export function dismissReservationExpiredNotice() {
  cartStore.reservationExpiredNotice = false
}

export async function fetchRecommendations() {
  cartStore.isRecommendationsLoading = true
  cartStore.recommendationsError = null
  try {
    cartStore.recommendations = await api.cart.recommendations()
  } catch (e) {
    cartStore.recommendationsError = errMessage(e)
  } finally {
    cartStore.isRecommendationsLoading = false
  }
}

export async function addItem(
  productRef: string,
  quantity = 1,
  variantRef?: string | null,
  options?: AddItemOptions | CartAddedFeedback,
) {
  const { feedback, productHint } = normalizeAddItemOptions(options)
  cartStore.isLoading = true
  cartStore.error = null
  try {
    cartStore.cart = await api.cart.addItem({
      productRef,
      quantity,
      variantRef,
      productHint,
    })
    mirrorCartToLocalStorage()
    notifyCartItemAdded({
      productName: feedback?.productName ?? productRef,
      quantity: feedback?.quantity ?? quantity,
      imageUrl: feedback?.imageUrl,
    })
  } catch (e) {
    cartStore.error = errMessage(e)
    throw e
  } finally {
    cartStore.isLoading = false
  }
}

export async function updateItem(id: string, quantity: number) {
  cartStore.isLoading = true
  cartStore.error = null
  try {
    cartStore.cart = await api.cart.patchItem(id, { quantity })
    mirrorCartToLocalStorage()
    void checkCartAvailability()
  } catch (e) {
    cartStore.error = errMessage(e)
    throw e
  } finally {
    cartStore.isLoading = false
  }
}

export async function removeItem(id: string, options?: { silent?: boolean }) {
  if (!options?.silent) cartStore.isLoading = true
  cartStore.error = null
  try {
    cartStore.cart = await api.cart.removeItem(id)
    mirrorCartToLocalStorage()
    void checkCartAvailability()
  } catch (e) {
    cartStore.error = errMessage(e)
    throw e
  } finally {
    if (!options?.silent) cartStore.isLoading = false
  }
}

export async function clearCart() {
  cartStore.isLoading = true
  cartStore.error = null
  try {
    cartStore.cart = await api.cart.clear()
    cartStore.recommendations = []
    cartStore.stockInsufficient = []
    clearLocalCartMirror()
  } catch (e) {
    cartStore.error = errMessage(e)
  } finally {
    cartStore.isLoading = false
  }
}

export async function reprice() {
  cartStore.isLoading = true
  cartStore.error = null
  try {
    cartStore.cart = await api.cart.reprice()
    mirrorCartToLocalStorage()
  } catch (e) {
    cartStore.error = errMessage(e)
    throw e
  } finally {
    cartStore.isLoading = false
  }
}

export async function checkCartAvailability() {
  if (!cartStore.cart?.items.length) {
    cartStore.stockInsufficient = []
    return
  }
  try {
    const result = await dedupeAsync('cart:stock', () => api.cart.stock())
    cartStore.stockInsufficient = result.ok ? [] : result.insufficient
  } catch {
    // Polling silenzioso: non sovrascrivere errori utente del carrello
  }
}

export async function moveLineToWishlist(line: {
  id: string
  productRef: string
  variantRef: string | null
}) {
  const { addWishlistItem } = await import('@/features/wishlist/wishlist.actions')
  await addWishlistItem(line.productRef, line.variantRef)
  await removeItem(line.id)
}
