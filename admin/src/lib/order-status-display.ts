import type { OrdersAdminList } from '@/types/orders'

export const ORDER_STATUS_LABEL: Record<string, string> = {
  CART_CREATED: 'Carrello',
  CHECKOUT_STARTED: 'Checkout',
  PAYMENT_STARTED: 'Pagamento',
  PAYMENT_PENDING: 'In attesa',
  PAID: 'Pagato',
  PAYMENT_FAILED: 'Fallito',
  ABANDONED: 'Abbandonato',
  CANCELLED: 'Annullato',
  CONFIRMED: 'Confermato',
  COMPLETED: 'Completato',
}

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'Non avviato',
  CREATED: 'Creato',
  PENDING: 'In attesa',
  AUTHORIZED: 'Autorizzato',
  CAPTURED: 'Incassato',
  FAILED: 'Fallito',
  CANCELLED: 'Annullato',
  REFUNDED: 'Rimborsato',
}

export const ORDER_STATUS_FILTER_OPTIONS = Object.entries(ORDER_STATUS_LABEL).map(
  ([value, label]) => ({ value, label }),
)

export const PAYMENT_STATUS_FILTER_OPTIONS = Object.entries(PAYMENT_STATUS_LABEL).map(
  ([value, label]) => ({ value, label }),
)

export function orderStatusPillClass(status: string): string {
  if (['PAID', 'CONFIRMED', 'COMPLETED'].includes(status)) {
    return 'bg-emerald-100 text-emerald-800'
  }
  if (['PAYMENT_PENDING', 'CHECKOUT_STARTED', 'PAYMENT_STARTED'].includes(status)) {
    return 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
  }
  if (['PAYMENT_FAILED', 'ABANDONED', 'CANCELLED'].includes(status)) {
    return 'bg-red-100 text-red-800'
  }
  if (status === 'CART_CREATED') {
    return 'bg-slate-100 text-slate-700'
  }
  return 'bg-slate-100 text-slate-700'
}

export function paymentStatusPillClass(status: string): string {
  if (status === 'CAPTURED' || status === 'AUTHORIZED') {
    return 'bg-emerald-100 text-emerald-800'
  }
  if (status === 'PENDING' || status === 'CREATED') {
    return 'bg-amber-100 text-amber-900'
  }
  if (status === 'FAILED' || status === 'CANCELLED') {
    return 'bg-red-100 text-red-800'
  }
  return 'bg-slate-100 text-slate-600'
}

export type OrdersListSort = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'action'

export const ORDERS_LIST_SORT_LABEL: Record<OrdersListSort, string> = {
  action: 'Priorità azioni',
  date_desc: 'Data più recente',
  date_asc: 'Data meno recente',
  amount_desc: 'Importo decrescente',
  amount_asc: 'Importo crescente',
}

export function orderListSortGroup(orderStatus: string): number {
  if (['PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(orderStatus)) return 0
  if (['CHECKOUT_STARTED', 'PAYMENT_STARTED'].includes(orderStatus)) return 1
  if (['PAID', 'CONFIRMED', 'COMPLETED'].includes(orderStatus)) return 2
  if (orderStatus === 'CART_CREATED') return 3
  if (['ABANDONED', 'CANCELLED'].includes(orderStatus)) return 4
  return 3
}

export function sortOrdersListItems<T extends OrdersAdminList['items'][number]>(
  items: readonly T[],
  sort: OrdersListSort,
): T[] {
  const copy = [...items] as T[]
  copy.sort((a, b) => {
    if (sort === 'action') {
      const ga = orderListSortGroup(a.orderStatus)
      const gb = orderListSortGroup(b.orderStatus)
      if (ga !== gb) return ga - gb
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (sort === 'date_asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    if (sort === 'amount_desc') {
      return (b.amountTotal ?? 0) - (a.amountTotal ?? 0)
    }
    if (sort === 'amount_asc') {
      return (a.amountTotal ?? 0) - (b.amountTotal ?? 0)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  return copy
}
