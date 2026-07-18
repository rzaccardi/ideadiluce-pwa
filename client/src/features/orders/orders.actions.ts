import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import { ApiRequestError } from '@/types/api'
import { ordersStore } from './orders.store'

const ORDERS_LIST_TTL_MS = 60_000
let ordersListFetchedAt = 0

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore ordini'
}

async function loadOrdersList() {
  ordersStore.isListLoading = true
  ordersStore.listError = null
  try {
    ordersStore.list = await api.orders.list()
    ordersListFetchedAt = Date.now()
  } catch (e) {
    ordersStore.listError = errMessage(e)
    ordersStore.list = null
  } finally {
    ordersStore.isListLoading = false
  }
}

export function fetchOrdersList(options?: { force?: boolean }) {
  if (
    !options?.force &&
    ordersStore.list != null &&
    !ordersStore.listError &&
    Date.now() - ordersListFetchedAt < ORDERS_LIST_TTL_MS
  ) {
    return Promise.resolve()
  }
  return dedupeAsync('orders:list', loadOrdersList)
}

async function loadOrderDetail(id: string) {
  ordersStore.isDetailLoading = true
  ordersStore.detailError = null
  ordersStore.detailId = id
  try {
    ordersStore.detail = await api.orders.get(id)
  } catch (e) {
    ordersStore.detail = null
    ordersStore.detailError = errMessage(e)
  } finally {
    ordersStore.isDetailLoading = false
  }
}

export function fetchOrderDetail(id: string) {
  if (!id) return Promise.resolve()
  if (
    !ordersStore.isDetailLoading &&
    ordersStore.detail?.id === id &&
    !ordersStore.detailError
  ) {
    return Promise.resolve()
  }
  return dedupeAsync(`orders:detail:${id}`, () => loadOrderDetail(id))
}

export function resetOrderDetail() {
  ordersStore.detail = null
  ordersStore.detailId = null
  ordersStore.detailError = null
  ordersStore.isDetailLoading = false
  ordersStore.recommendations = []
  ordersStore.recommendationsOrderId = null
  ordersStore.recommendationsError = null
  ordersStore.recommendationsLoading = false
}

export function resetOrdersStore() {
  ordersListFetchedAt = 0
  ordersStore.list = null
  ordersStore.isListLoading = false
  ordersStore.listError = null
  resetOrderDetail()
}

export async function reorderOrder(id: string) {
  return api.orders.reorder(id)
}

async function loadOrderRecommendations(id: string) {
  ordersStore.recommendationsLoading = true
  ordersStore.recommendationsError = null
  ordersStore.recommendationsOrderId = id
  try {
    ordersStore.recommendations = await api.orders.recommendations(id)
  } catch (e) {
    ordersStore.recommendations = []
    ordersStore.recommendationsError = errMessage(e)
  } finally {
    ordersStore.recommendationsLoading = false
  }
}

export function fetchOrderRecommendations(id: string) {
  if (!id) return Promise.resolve()
  if (
    ordersStore.recommendationsOrderId === id &&
    !ordersStore.recommendationsError &&
    !ordersStore.recommendationsLoading
  ) {
    return Promise.resolve()
  }
  return dedupeAsync(`orders:recommendations:${id}`, () => loadOrderRecommendations(id))
}
