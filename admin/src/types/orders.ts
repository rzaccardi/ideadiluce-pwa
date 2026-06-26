import type { OdooSyncQueueItem } from '@/types/odoo'

export type OrdersAdminStats = {
  periodDays: number
  since: string
  paidCount: number
  revenueCents: number
  averageOrderValueCents: number
  avgLineItems: number
  abandonedCount: number
  checkoutStartedCount: number
  checkoutConversionPct: number
  repeatCustomerPct: number
  guestCheckoutPct: number
  medianMinutesToCheckout: number | null
  medianMinutesToPay: number | null
  medianMinutesCartToPaid: number | null
  failedPaymentAttempts: number
  funnel: Array<{ status: string; count: number; label: string }>
  paymentMethods: Array<{ method: string; count: number; revenueCents: number }>
  singleItemOrderPct: number
  odooMappedPct: number
}

export type OrderAdminSource = 'pwa' | 'odoo_manual' | 'other_ecommerce' | 'odoo_historical'

export const ORDER_SOURCE_LABEL: Record<OrderAdminSource, string> = {
  pwa: 'E-commerce',
  odoo_manual: 'Odoo manuale',
  other_ecommerce: 'Altro e-commerce',
  odoo_historical: 'Storico Odoo',
}

export type OrderAdminSourceFilter = OrderAdminSource | 'all'

export const ORDER_SOURCE_FILTER_OPTIONS: { value: OrderAdminSourceFilter; label: string }[] = [
  { value: 'all', label: 'Tutte le fonti' },
  ...(Object.entries(ORDER_SOURCE_LABEL) as [OrderAdminSource, string][]).map(([value, label]) => ({
    value,
    label,
  })),
]

export type OrdersAdminListQueryFilters = {
  q?: string
  source?: OrderAdminSourceFilter
  status?: string
  paymentStatus?: string
  phase?: string
  days?: number
  sort?: string
}

export type OrdersAdminList = {
  items: Array<{
    id: string
    email: string
    orderStatus: string
    paymentStatus: string
    paymentMethod: string | null
    currencyCode: string
    amountTotal: number | null
    lineItemCount: number
    odooSaleOrderId: number | null
    userId: string | null
    isGuest: boolean
    createdAt: string
    paidAt: string | null
    checkoutStartedAt: string | null
    minutesToPay: number | null
    source: OrderAdminSource
    sourceLabel: string
    odooOrderName: string | null
    partnerName: string | null
    isOdooOnly: boolean
    odooLastSyncStatus: string | null
  }>
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type OrdersAdminDetail = {
  id: string
  email: string
  orderStatus: string
  paymentStatus: string
  paymentMethod: string | null
  currencyCode: string
  amountTotal: number | null
  userId: string | null
  isGuest: boolean
  cartId: string | null
  checkoutSessionId: string | null
  source: OrderAdminSource
  sourceLabel: string
  odooOrderName: string | null
  partnerName: string | null
  clientOrderRef: string | null
  isOdooOnly: boolean
  odooPartnerId: number | null
  odooSaleOrderId: number | null
  odooLastSyncStatus: string | null
  lastPaymentError: string | null
  createdAt: string
  checkoutStartedAt: string | null
  paymentStartedAt: string | null
  paidAt: string | null
  abandonedAt: string | null
  cart: {
    status: string
    estimatedTotal: number | null
    reservationExpiresAt: string | null
    abandonedAt: string | null
    createdAt: string
  } | null
  sessionId?: string | null
  lines: Array<{
    productRef: string
    productSlug: string | null
    productName: string | null
    variantRef: string | null
    quantity: number
    unitEstimateCents: number | null
    odooProductId: number | null
    odooTemplateId: number | null
  }>
  checkoutAttempts: Array<{
    attemptNo: number
    status: string
    provider: string | null
    failureReason: string | null
    createdAt: string
  }>
  payments: Array<{
    id: string
    method: string
    status: string
    amount: number
    createdAt: string
    capturedAt: string | null
    failedAt: string | null
    failureReason: string | null
  }>
  timeline: Array<{ at: string; kind: string; label: string; detail?: string }>
  relatedOrders: Array<{
    id: string
    orderStatus: string
    amountTotal: number | null
    paidAt: string | null
    lineItemCount: number
  }>
  uxInsights: Array<{
    code: string
    severity: 'info' | 'warning' | 'success'
    title: string
    description: string
  }>
  odooSyncQueue: OdooSyncQueueItem | null
}

export type PaidSyncPendingSummary = {
  count: number
  items: Array<{
    id: string
    email: string
    amountTotal: number | null
    paidAt: string | null
    odooSaleOrderId: number | null
    lastPaymentError: string | null
    odooLastSyncStatus: string
    paidSyncAlertSentAt: string | null
  }>
}
