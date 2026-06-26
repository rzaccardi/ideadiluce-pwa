import { api } from '@/api/endpoints'
import { ApiRequestError } from '@/types/api'
import { quotesStore } from './quotes.store'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Operazione non riuscita'
}

export async function fetchQuotesList() {
  quotesStore.isListLoading = true
  quotesStore.listError = null
  try {
    quotesStore.list = await api.quotes.list()
  } catch (e) {
    quotesStore.listError = errMessage(e)
    throw e
  } finally {
    quotesStore.isListLoading = false
  }
}

export async function fetchQuoteDetail(id: string) {
  quotesStore.isDetailLoading = true
  quotesStore.detailError = null
  try {
    quotesStore.detail = await api.quotes.get(id)
    return quotesStore.detail
  } catch (e) {
    quotesStore.detailError = errMessage(e)
    throw e
  } finally {
    quotesStore.isDetailLoading = false
  }
}

export async function submitQuoteRequest(body: {
  notes?: string
  billingAddress?: import('@/types/dto').UserAddressDTO
  shippingAddress?: import('@/types/dto').UserAddressDTO
}) {
  quotesStore.isSubmitting = true
  quotesStore.submitError = null
  try {
    return await api.quotes.request(body)
  } catch (e) {
    quotesStore.submitError = errMessage(e)
    throw e
  } finally {
    quotesStore.isSubmitting = false
  }
}

export async function startQuoteCheckout(id: string) {
  return api.quotes.checkout(id)
}

export function resetQuotesStore() {
  quotesStore.list = null
  quotesStore.isListLoading = false
  quotesStore.listError = null
  quotesStore.detail = null
  quotesStore.isDetailLoading = false
  quotesStore.detailError = null
  quotesStore.isSubmitting = false
  quotesStore.submitError = null
}
