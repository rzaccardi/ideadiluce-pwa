import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import { ApiRequestError } from '@/types/api'
import { invoicesStore } from './invoices.store'

const INVOICES_LIST_TTL_MS = 60_000
let invoicesListFetchedAt = 0

function errMessage(e: unknown) {
  return e instanceof ApiRequestError
    ? (e.userMessage ?? e.message)
    : 'Impossibile caricare le fatture.'
}

async function loadInvoicesList() {
  invoicesStore.isListLoading = true
  invoicesStore.listError = null
  try {
    invoicesStore.list = await api.invoices.list()
    invoicesListFetchedAt = Date.now()
  } catch (e) {
    invoicesStore.listError = errMessage(e)
    invoicesStore.list = null
  } finally {
    invoicesStore.isListLoading = false
  }
}

export function fetchInvoicesList(options?: { force?: boolean }) {
  if (
    !options?.force &&
    invoicesStore.list != null &&
    !invoicesStore.listError &&
    Date.now() - invoicesListFetchedAt < INVOICES_LIST_TTL_MS
  ) {
    return Promise.resolve()
  }
  return dedupeAsync('invoices:list', loadInvoicesList)
}

export function resetInvoicesStore() {
  invoicesListFetchedAt = 0
  invoicesStore.list = null
  invoicesStore.isListLoading = false
  invoicesStore.listError = null
}
