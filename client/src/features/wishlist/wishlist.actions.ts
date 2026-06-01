import { api } from '@/api/endpoints'
import { ApiRequestError } from '@/types/api'
import { wishlistStore } from './wishlist.store'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore wishlist'
}

export async function fetchWishlist() {
  wishlistStore.isLoading = true
  wishlistStore.error = null
  try {
    wishlistStore.items = await api.wishlist.list()
  } catch (e) {
    wishlistStore.error = errMessage(e)
  } finally {
    wishlistStore.isLoading = false
  }
}

export async function addWishlistItem(productRef: string, variantRef?: string | null) {
  wishlistStore.isLoading = true
  wishlistStore.error = null
  try {
    await api.wishlist.add({ productRef, variantRef })
    await fetchWishlist()
  } catch (e) {
    wishlistStore.error = errMessage(e)
    throw e
  } finally {
    wishlistStore.isLoading = false
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
