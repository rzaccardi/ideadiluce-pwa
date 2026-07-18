import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import { ApiRequestError } from '@/types/api'
import { quotesStore } from './quotes.store'

const QUOTES_LIST_TTL_MS = 60_000
let quotesListFetchedAt = 0

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Operazione non riuscita'
}

async function loadQuotesList() {
  quotesStore.isListLoading = true
  quotesStore.listError = null
  try {
    quotesStore.list = await api.quotes.list()
    quotesListFetchedAt = Date.now()
  } catch (e) {
    quotesStore.listError = errMessage(e)
    throw e
  } finally {
    quotesStore.isListLoading = false
  }
}

export function fetchQuotesList(options?: { force?: boolean }) {
  if (
    !options?.force &&
    quotesStore.list != null &&
    !quotesStore.listError &&
    Date.now() - quotesListFetchedAt < QUOTES_LIST_TTL_MS
  ) {
    return Promise.resolve()
  }
  return dedupeAsync('quotes:list', loadQuotesList)
}

async function loadQuoteDetail(id: string) {
  quotesStore.isDetailLoading = true
  quotesStore.detailError = null
  quotesStore.detailId = id
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

export function fetchQuoteDetail(id: string) {
  if (!id) return Promise.resolve(null)
  if (quotesStore.detailId === id && quotesStore.detail && !quotesStore.detailError) {
    return Promise.resolve(quotesStore.detail)
  }
  return dedupeAsync(`quotes:detail:${id}`, () => loadQuoteDetail(id))
}

export async function submitQuoteRequest(body: {
  notes?: string
  billingAddress?: import('@/types/dto').UserAddressDTO
  shippingAddress?: import('@/types/dto').UserAddressDTO
}) {
  quotesStore.isSubmitting = true
  quotesStore.submitError = null
  try {
    const result = await api.quotes.request(body)
    quotesListFetchedAt = 0
    return result
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
  quotesListFetchedAt = 0
  quotesStore.list = null
  quotesStore.isListLoading = false
  quotesStore.listError = null
  quotesStore.detail = null
  quotesStore.detailId = null
  quotesStore.isDetailLoading = false
  quotesStore.detailError = null
  quotesStore.isSubmitting = false
  quotesStore.submitError = null
}
