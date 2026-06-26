import { cn } from '@/lib/utils'

/** Fasi del journey PWA (analoghe al ciclo programma → ordine → fattura VIX). */
export type OrderJourneyPhase = 'cart' | 'checkout' | 'paid' | 'problem'

export type OrderJourneyPhaseFilter = 'tutte' | OrderJourneyPhase

export const ORDER_JOURNEY_PHASE_ORDER: OrderJourneyPhaseFilter[] = [
  'tutte',
  'cart',
  'checkout',
  'paid',
  'problem',
]

export const ORDER_JOURNEY_PHASE_LABEL: Record<OrderJourneyPhase, string> = {
  cart: 'Carrello',
  checkout: 'Checkout',
  paid: 'Pagato',
  problem: 'Problema',
}

export const ORDER_JOURNEY_PHASE_FILTER_LABEL: Record<OrderJourneyPhaseFilter, string> = {
  tutte: 'Tutti',
  cart: 'Carrello',
  checkout: 'Checkout',
  paid: 'Pagato',
  problem: 'Problemi',
}

const STATUS_TO_PHASE: Record<string, OrderJourneyPhase> = {
  CART_CREATED: 'cart',
  CHECKOUT_STARTED: 'checkout',
  PAYMENT_STARTED: 'checkout',
  PAYMENT_PENDING: 'checkout',
  PAID: 'paid',
  CONFIRMED: 'paid',
  COMPLETED: 'paid',
  PAYMENT_FAILED: 'problem',
  ABANDONED: 'problem',
  CANCELLED: 'problem',
}

export const ORDER_PHASE_STATUSES: Record<OrderJourneyPhase, string[]> = {
  cart: ['CART_CREATED'],
  checkout: ['CHECKOUT_STARTED', 'PAYMENT_STARTED', 'PAYMENT_PENDING'],
  paid: ['PAID', 'CONFIRMED', 'COMPLETED'],
  problem: ['PAYMENT_FAILED', 'ABANDONED', 'CANCELLED'],
}

export function orderJourneyPhase(orderStatus: string): OrderJourneyPhase {
  return STATUS_TO_PHASE[orderStatus] ?? 'checkout'
}

export const ORDER_FASE_TABLE_COLUMN_CLASS = 'w-0 whitespace-nowrap'

export function orderJourneyPhaseBadgeClass(phase: OrderJourneyPhase): string {
  switch (phase) {
    case 'cart':
      return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'checkout':
      return 'bg-amber-100 text-amber-900 border-amber-200'
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'problem':
      return 'bg-red-100 text-red-800 border-red-200'
  }
}

export function orderJourneyPhaseRowClass(phase: OrderJourneyPhase): string {
  switch (phase) {
    case 'cart':
      return 'border-l-4 border-l-sky-400 bg-sky-50/40 hover:bg-sky-50/70'
    case 'checkout':
      return 'border-l-4 border-l-amber-400 bg-amber-50/40 hover:bg-amber-50/70'
    case 'paid':
      return 'border-l-4 border-l-emerald-400 bg-emerald-50/40 hover:bg-emerald-50/70'
    case 'problem':
      return 'border-l-4 border-l-red-400 bg-red-50/40 hover:bg-red-50/70'
  }
}

export function orderListRowClassName(input: {
  orderStatus: string
  highlight?: boolean
  odooLastSyncStatus?: string | null
}): string {
  const phase = orderJourneyPhase(input.orderStatus)
  return cn(
    orderJourneyPhaseRowClass(phase),
    input.highlight && 'ring-1 ring-inset ring-amber-300',
    input.odooLastSyncStatus === 'FAILED' && 'ring-1 ring-inset ring-red-300',
  )
}

export function orderListRowHighlight(item: {
  orderStatus: string
  paidAt: string | null
  odooLastSyncStatus?: string | null
}): boolean {
  if (item.odooLastSyncStatus === 'FAILED') return true
  if (['PAYMENT_PENDING', 'PAYMENT_FAILED', 'ABANDONED'].includes(item.orderStatus)) {
    return true
  }
  if (item.orderStatus === 'CHECKOUT_STARTED' && !item.paidAt) return true
  return false
}

export function ordersFaseTabTriggerClass(
  phase: OrderJourneyPhaseFilter,
  active: boolean,
): string {
  if (!active) return ''
  switch (phase) {
    case 'cart':
      return 'bg-sky-100 text-sky-900 shadow-sm ring-1 ring-sky-300'
    case 'checkout':
      return 'bg-amber-100 text-amber-900 shadow-sm ring-1 ring-amber-300'
    case 'paid':
      return 'bg-emerald-100 text-emerald-900 shadow-sm ring-1 ring-emerald-300'
    case 'problem':
      return 'bg-red-100 text-red-900 shadow-sm ring-1 ring-red-300'
    default:
      return ''
  }
}

export function ordersFaseCardBorderClass(phase: OrderJourneyPhaseFilter): string {
  switch (phase) {
    case 'cart':
      return 'border-sky-200'
    case 'checkout':
      return 'border-amber-200'
    case 'paid':
      return 'border-emerald-200'
    case 'problem':
      return 'border-red-200'
    default:
      return 'border-gray-200'
  }
}

export function ordersFaseTabDotClass(phase: OrderJourneyPhase): string {
  switch (phase) {
    case 'cart':
      return 'bg-sky-500'
    case 'checkout':
      return 'bg-amber-500'
    case 'paid':
      return 'bg-emerald-500'
    case 'problem':
      return 'bg-red-500'
  }
}
