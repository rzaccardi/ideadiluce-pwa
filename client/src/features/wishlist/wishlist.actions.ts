import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import { resolveOdooCatalogProductCard } from '@/lib/odoo-catalog/lookup'
import type { PwaLocale } from '@/lib/locale'
import { ApiRequestError } from '@/types/api'
import type { ProductCardDTO } from '@/types/dto'
import { isProductInWishlist } from './wishlist.utils'
import { wishlistStore } from './wishlist.store'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore wishlist'
}

function productCacheKey() {
  return wishlistStore.items.map((i) => `${i.id}:${i.productRef}`).join('|')
}

async function loadWishlistProducts(locale: PwaLocale) {
  if (wishlistStore.items.length === 0) {
    wishlistStore.productEntries = []
    wishlistStore.productsError = null
    return
  }

  wishlistStore.isProductsLoading = true
  wishlistStore.productsError = null
  const byRef = new Map<string, ProductCardDTO>()

  try {
    const entries = await Promise.all(
      wishlistStore.items.map(async (item) => {
        let product = byRef.get(item.productRef)
        if (!product) {
          const resolved = await resolveOdooCatalogProductCard(item.productRef, locale)
          if (!resolved) {
            return {
              itemId: item.id,
              productRef: item.productRef,
              variantRef: item.variantRef,
              product: null,
              unavailable: true,
            }
          }
          product = resolved
          byRef.set(item.productRef, product)
        }
        return {
          itemId: item.id,
          productRef: item.productRef,
          variantRef: item.variantRef,
          product,
          unavailable: false,
        }
      }),
    )
    wishlistStore.productEntries = entries
  } catch (e) {
    wishlistStore.productEntries = []
    wishlistStore.productsError = errMessage(e)
  } finally {
    wishlistStore.isProductsLoading = false
  }
}

export function fetchWishlistProducts(locale: PwaLocale) {
  const key = `wishlist:products:${locale}:${productCacheKey()}`
  return dedupeAsync(key, () => loadWishlistProducts(locale))
}

async function loadWishlist() {
  wishlistStore.isLoading = true
  wishlistStore.error = null
  try {
    wishlistStore.items = await api.wishlist.list()
    wishlistStore.hydrated = true
  } catch (e) {
    wishlistStore.error = errMessage(e)
  } finally {
    wishlistStore.isLoading = false
  }
}

export type FetchWishlistOptions = {
  force?: boolean
}

export function fetchWishlist(options?: FetchWishlistOptions) {
  if (!options?.force && wishlistStore.hydrated) {
    return Promise.resolve()
  }
  return dedupeAsync('wishlist:list', loadWishlist)
}

export function resetWishlistStore() {
  wishlistStore.items = []
  wishlistStore.productEntries = []
  wishlistStore.hydrated = false
  wishlistStore.error = null
  wishlistStore.productsError = null
}

function findWishlistItem(productRef: string, variantRef?: string | null) {
  if (variantRef === undefined) {
    return wishlistStore.items.find((i) => i.productRef === productRef)
  }
  const variant = variantRef ?? null
  return wishlistStore.items.find(
    (i) => i.productRef === productRef && (i.variantRef ?? null) === variant,
  )
}

export async function addWishlistItem(productRef: string, variantRef?: string | null) {
  if (isProductInWishlist(wishlistStore.items, productRef, variantRef)) {
    return findWishlistItem(productRef, variantRef)
  }

  wishlistStore.error = null
  try {
    const item = await api.wishlist.add({ productRef, variantRef })
    const variant = variantRef ?? null
    const existingIndex = wishlistStore.items.findIndex(
      (i) => i.productRef === productRef && (i.variantRef ?? null) === variant,
    )
    if (existingIndex >= 0) {
      wishlistStore.items[existingIndex] = item
    } else {
      wishlistStore.items = [item, ...wishlistStore.items]
    }
    return item
  } catch (e) {
    wishlistStore.error = errMessage(e)
    throw e
  }
}

export async function removeWishlistItem(id: string) {
  wishlistStore.isLoading = true
  wishlistStore.error = null
  try {
    await api.wishlist.remove(id)
    wishlistStore.items = wishlistStore.items.filter((i) => i.id !== id)
  } catch (e) {
    wishlistStore.error = errMessage(e)
    throw e
  } finally {
    wishlistStore.isLoading = false
  }
}
