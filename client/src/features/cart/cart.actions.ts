import { api } from '@/api/endpoints'
import { ApiRequestError } from '@/types/api'
import { cartStore } from './cart.store'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore carrello'
}

export async function fetchCart() {
  cartStore.isLoading = true
  cartStore.error = null
  try {
    cartStore.cart = await api.cart.get()
  } catch (e) {
    cartStore.error = errMessage(e)
  } finally {
    cartStore.isLoading = false
  }
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

export async function addItem(productRef: string, quantity = 1, variantRef?: string | null) {
  cartStore.isLoading = true
  cartStore.error = null
  try {
    cartStore.cart = await api.cart.addItem({ productRef, quantity, variantRef })
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
  } catch (e) {
    cartStore.error = errMessage(e)
    throw e
  } finally {
    cartStore.isLoading = false
  }
}

export async function removeItem(id: string) {
  cartStore.isLoading = true
  cartStore.error = null
  try {
    cartStore.cart = await api.cart.removeItem(id)
  } catch (e) {
    cartStore.error = errMessage(e)
    throw e
  } finally {
    cartStore.isLoading = false
  }
}

export async function clearCart() {
  cartStore.isLoading = true
  cartStore.error = null
  try {
    cartStore.cart = await api.cart.clear()
    cartStore.recommendations = []
  } catch (e) {
    cartStore.error = errMessage(e)
    throw e
  } finally {
    cartStore.isLoading = false
  }
}

export async function reprice() {
  cartStore.isLoading = true
  cartStore.error = null
  try {
    cartStore.cart = await api.cart.reprice()
  } catch (e) {
    cartStore.error = errMessage(e)
    throw e
  } finally {
    cartStore.isLoading = false
  }
}
