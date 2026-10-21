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
import { toServerCartAddHint, type CartAddProductHint } from './cart-add-hint'
import {
  applyOptimisticAdd,
  applyOptimisticQuantity,
  applyOptimisticRemove,
  isOptimisticCartId,
} from './cart-optimistic'
import { cartStore } from './cart.store'
import type { CartDTO, CartItemDTO } from '@/types/dto'

export type AddItemOptions = {
  feedback?: CartAddedFeedback
  productHint?: CartAddProductHint
  /** Non mostra il toast di conferma (es. accessori aggiunti insieme al prodotto). */
  silent?: boolean
}

function normalizeAddItemOptions(
  options?: AddItemOptions | CartAddedFeedback,
): AddItemOptions {
  if (!options) return {}
  if ('productHint' in options || 'silent' in options) return options
  if ('productName' in options) return { feedback: options }
  return options
}

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore carrello'
}

function mirrorCartToLocalStorage() {
  if (cartStore.cart && isOptimisticCartId(cartStore.cart.id)) return
  saveLocalCartMirror(cartStore.cart)
}

function detectStaleCartMirror(serverCartId: string): boolean {
  const mirror = loadLocalCartMirror()
  if (!mirror) return false
  return mirror.cartId !== serverCartId
}

let cartWriteGeneration = 0

function markCartWrite() {
  cartWriteGeneration += 1
}

/** Dopo login/logout: evita di mostrare il carrello guest in cache mentre si ricarica quello server. */
export function resetCartForAuthChange() {
  markCartWrite()
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
  const generation = cartWriteGeneration
  if (!options?.silent) cartStore.isLoading = true
  cartStore.error = null
  try {
    const next = await api.cart.get({ reprice: options?.reprice })
    if (generation !== cartWriteGeneration) return
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
    if (generation !== cartWriteGeneration) return
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
  /** Richiede il ricalcolo prezzi lato server. Usato dalla pagina carrello. */
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

let pendingCartMutations: Promise<void> = Promise.resolve()
let pendingMutationCount = 0

function enqueueCartMutation(task: () => Promise<void>): Promise<void> {
  const run = pendingCartMutations.then(task, task)
  pendingCartMutations = run.then(() => undefined, () => undefined)
  return run
}

const QUANTITY_PATCH_DEBOUNCE_MS = 280
const pendingQuantityByLine = new Map<string, number>()
const quantityFlushTimers = new Map<string, ReturnType<typeof setTimeout>>()
let stockCheckTimer: ReturnType<typeof setTimeout> | null = null

function clearQuantityFlush(lineId: string) {
  const timer = quantityFlushTimers.get(lineId)
  if (timer) clearTimeout(timer)
  quantityFlushTimers.delete(lineId)
  pendingQuantityByLine.delete(lineId)
}

function scheduleDebouncedStockCheck() {
  if (stockCheckTimer) clearTimeout(stockCheckTimer)
  stockCheckTimer = setTimeout(() => {
    stockCheckTimer = null
    void checkCartAvailability()
  }, 600)
}

function normalizeVariantKey(value: string | null | undefined): string {
  if (value == null) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const legacy = /^VAR-(\d+)$/i.exec(trimmed)
  return legacy ? legacy[1] : trimmed
}

function parseOptimisticLineId(lineId: string): { productRef: string; variantRef: string } | null {
  if (!lineId.startsWith('optimistic:')) return null
  const rest = lineId.slice('optimistic:'.length)
  const idx = rest.indexOf(':')
  if (idx < 0) return { productRef: rest, variantRef: '' }
  return { productRef: rest.slice(0, idx), variantRef: rest.slice(idx + 1) }
}

function lineMatchesIdentity(
  line: Pick<CartItemDTO, 'id' | 'productRef' | 'productSlug' | 'variantRef'>,
  identity: { lineId: string; productRef?: string; variantRef?: string | null },
): boolean {
  if (line.id === identity.lineId) return true
  if (!identity.productRef) return false
  const productOk =
    line.productRef === identity.productRef || line.productSlug === identity.productRef
  if (!productOk) return false
  return normalizeVariantKey(line.variantRef) === normalizeVariantKey(identity.variantRef)
}

/** Risolve l’id riga server anche dopo un add ottimistico (id `optimistic:…`). */
async function resolveServerLineId(identity: {
  lineId: string
  productRef?: string
  variantRef?: string | null
}): Promise<string | null> {
  const local = cartStore.cart?.items.find((line) => lineMatchesIdentity(line, identity))
  if (local && !local.id.startsWith('optimistic:')) return local.id

  const parsed = parseOptimisticLineId(identity.lineId)
  const productRef = identity.productRef ?? parsed?.productRef
  const variantRef = identity.variantRef ?? parsed?.variantRef ?? null
  if (!productRef) return null

  let serverCart: CartDTO
  try {
    serverCart = await api.cart.get()
  } catch {
    return null
  }
  const match = serverCart.items.find((line) =>
    lineMatchesIdentity(line, { lineId: identity.lineId, productRef, variantRef }),
  )
  return match?.id ?? null
}

async function flushPendingQuantityPatches() {
  const pending = [...pendingQuantityByLine.entries()]
  for (const [lineId] of pending) {
    clearQuantityFlush(lineId)
  }
  for (const [lineId, quantity] of pending) {
    const local = cartStore.cart?.items.find((line) => line.id === lineId)
    const parsed = parseOptimisticLineId(lineId)
    const identity = {
      lineId,
      productRef: local?.productRef ?? parsed?.productRef,
      variantRef: local?.variantRef ?? parsed?.variantRef ?? null,
    }
    pendingMutationCount += 1
    await enqueueCartMutation(async () => {
      try {
        const targetId = await resolveServerLineId(identity)
        if (!targetId) return
        const next = await api.cart.patchItem(targetId, { quantity })
        if (pendingMutationCount <= 1) {
          cartStore.cart = next
          mirrorCartToLocalStorage()
        }
        cartStore.error = null
      } catch (e) {
        cartStore.error = errMessage(e)
        await loadCart({ skipMirrorCheck: true, silent: true })
        throw e
      } finally {
        pendingMutationCount -= 1
      }
    })
  }
}

export async function waitForPendingCartMutations() {
  await flushPendingQuantityPatches()
  let guard = 0
  while (pendingMutationCount > 0 && guard < 20) {
    await pendingCartMutations
    guard += 1
  }
}

export function fetchCart(options?: FetchCartOptions) {
  if (
    !options?.force &&
    cartStore.cart &&
    !isOptimisticCartId(cartStore.cart.id) &&
    pendingMutationCount === 0
  ) {
    return Promise.resolve()
  }
  queueCartFetchOptions(options)
  // Chiave unica per generazione: evita di riutilizzare un GET partito prima di un add.
  return waitForPendingCartMutations().then(() => {
    const generation = cartWriteGeneration
    return dedupeAsync(`cart:get:${generation}`, async () => {
      await Promise.resolve()
      if (cartWriteGeneration !== generation) return
      const opts = pendingCartFetch ?? {}
      pendingCartFetch = null
      return loadCart(opts)
    })
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
  const { feedback, productHint, silent } = normalizeAddItemOptions(options)
  cartStore.error = null
  markCartWrite()
  pendingMutationCount += 1
  cartStore.cart = applyOptimisticAdd({
    cart: cartStore.cart,
    productRef,
    quantity,
    variantRef: variantRef ?? null,
    productHint,
  })
  if (!silent) {
    notifyCartItemAdded({
      productName: feedback?.productName ?? productHint?.name ?? productRef,
      quantity: feedback?.quantity ?? quantity,
      imageUrl: feedback?.imageUrl ?? productHint?.imageUrl,
    })
  }

  return enqueueCartMutation(async () => {
    try {
      const next = await api.cart.addItem({
        productRef,
        quantity,
        variantRef,
        productHint: toServerCartAddHint(productHint),
      })
      if (pendingMutationCount <= 1) {
        cartStore.cart = next
        mirrorCartToLocalStorage()
      }
    } catch (e) {
      cartStore.error = errMessage(e)
      await loadCart({ skipMirrorCheck: true, silent: true })
      throw e
    } finally {
      pendingMutationCount -= 1
    }
  })
}

export async function updateItem(id: string, quantity: number) {
  markCartWrite()
  cartStore.error = null
  const nextQty = Math.max(1, Math.floor(quantity))
  const local = cartStore.cart?.items.find((line) => line.id === id)
  const parsed = parseOptimisticLineId(id)
  const identity = {
    lineId: id,
    productRef: local?.productRef ?? parsed?.productRef,
    variantRef: local?.variantRef ?? parsed?.variantRef ?? null,
  }
  cartStore.cart = applyOptimisticQuantity(cartStore.cart, id, nextQty)
  mirrorCartToLocalStorage()

  pendingQuantityByLine.set(id, nextQty)
  const existing = quantityFlushTimers.get(id)
  if (existing) clearTimeout(existing)

  quantityFlushTimers.set(
    id,
    setTimeout(() => {
      quantityFlushTimers.delete(id)
      const qty = pendingQuantityByLine.get(id)
      pendingQuantityByLine.delete(id)
      if (qty == null) return

      pendingMutationCount += 1
      void enqueueCartMutation(async () => {
        try {
          const targetId = await resolveServerLineId(identity)
          if (!targetId) return
          const next = await api.cart.patchItem(targetId, { quantity: qty })
          if (pendingMutationCount <= 1) {
            cartStore.cart = next
            mirrorCartToLocalStorage()
          }
          cartStore.error = null
          scheduleDebouncedStockCheck()
        } catch (e) {
          cartStore.error = errMessage(e)
          await loadCart({ skipMirrorCheck: true, silent: true })
        } finally {
          pendingMutationCount -= 1
        }
      })
    }, QUANTITY_PATCH_DEBOUNCE_MS),
  )
}

export async function removeItem(id: string, _options?: { silent?: boolean }) {
  markCartWrite()
  cartStore.error = null
  clearQuantityFlush(id)
  const local = cartStore.cart?.items.find((line) => line.id === id)
  const parsed = parseOptimisticLineId(id)
  const identity = {
    lineId: id,
    productRef: local?.productRef ?? parsed?.productRef,
    variantRef: local?.variantRef ?? parsed?.variantRef ?? null,
  }
  cartStore.cart = applyOptimisticRemove(cartStore.cart, id)
  mirrorCartToLocalStorage()
  pendingMutationCount += 1

  return enqueueCartMutation(async () => {
    try {
      const targetId = await resolveServerLineId(identity)
      if (!targetId) {
        cartStore.error = null
        return
      }
      const next = await api.cart.removeItem(targetId)
      if (pendingMutationCount <= 1) {
        cartStore.cart = next
        mirrorCartToLocalStorage()
      }
      cartStore.error = null
      scheduleDebouncedStockCheck()
    } catch (e) {
      cartStore.error = errMessage(e)
      await loadCart({ skipMirrorCheck: true, silent: true })
      throw e
    } finally {
      pendingMutationCount -= 1
    }
  })
}

/** Dopo un ordine concluso: scarta il carrello in memoria (anche fetch già in corso). */
export function discardCartAfterCheckout() {
  markCartWrite()
  invalidateDedupePrefix('cart:')
  cartStore.recommendations = []
  cartStore.stockInsufficient = []
  cartStore.reservationExpiredNotice = false
  cartStore.error = null
  if (cartStore.cart) {
    cartStore.cart = {
      ...cartStore.cart,
      items: [],
      itemCount: 0,
      purchasableItemCount: 0,
      estimatedSubtotal: null,
      estimatedTax: null,
      estimatedShipping: null,
      estimatedTotal: null,
      warnings: [],
      deliveryLeadDays: null,
      deliveryEstimateDays: null,
      freeShippingHint: null,
    }
  }
  clearLocalCartMirror()
}

/** Rilegge il carrello vuoto creato dal server dopo la conversione dell'ordine. */
export async function refreshCartAfterCheckout() {
  discardCartAfterCheckout()
  await fetchCart({ force: true, skipMirrorCheck: true, silent: true })
}

export async function clearCart() {
  markCartWrite()
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
  markCartWrite()
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

/** Conferma i prezzi aggiornati (consuma needsPricingConfirmation). */
export async function acknowledgePricing() {
  cartStore.error = null
  try {
    cartStore.cart = await api.cart.acknowledgePricing()
    mirrorCartToLocalStorage()
    return cartStore.cart
  } catch (e) {
    cartStore.error = errMessage(e)
    throw e
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
