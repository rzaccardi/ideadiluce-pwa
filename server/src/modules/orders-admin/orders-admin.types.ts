import type { OdooSyncQueueItemDTO } from '../../types/odoo.dto.js'

export type OrdersAdminFunnelStepDTO = {
  status: string
  count: number
  label: string
}

export type OrdersAdminPaymentBreakdownDTO = {
  method: string
  count: number
  revenueCents: number
}

export type OrdersAdminStatsDTO = {
  periodDays: number
  since: string
  /** Ordini con pagamento catturato nel periodo */
  paidCount: number
  revenueCents: number
  averageOrderValueCents: number
  /** Carrello medio (righe) sugli ordini pagati */
  avgLineItems: number
  abandonedCount: number
  checkoutStartedCount: number
  /** paid / checkoutStarted (0–100) */
  checkoutConversionPct: number
  /** Clienti con più di un ordine pagato (email) / clienti con almeno un pagato */
  repeatCustomerPct: number
  guestCheckoutPct: number
  /** Mediana minuti: creazione ordine → avvio checkout */
  medianMinutesToCheckout: number | null
  /** Mediana minuti: avvio checkout → pagato */
  medianMinutesToPay: number | null
  /** Mediana minuti: creazione carrello → pagato */
  medianMinutesCartToPaid: number | null
  failedPaymentAttempts: number
  funnel: OrdersAdminFunnelStepDTO[]
  paymentMethods: OrdersAdminPaymentBreakdownDTO[]
  singleItemOrderPct: number
  odooMappedPct: number
}

export type OrderAdminSource = 'pwa' | 'odoo_manual' | 'other_ecommerce' | 'odoo_historical'

export type OrdersAdminListItemDTO = {
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
}

export type OrdersAdminListDTO = {
  items: OrdersAdminListItemDTO[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type OrdersAdminTimelineEventDTO = {
  at: string
  kind: string
  label: string
  detail?: string
}

export type OrdersAdminCartLineDTO = {
  productRef: string
  productSlug: string | null
  productName: string | null
  variantRef: string | null
  quantity: number
  unitEstimateCents: number | null
  /** ID Odoo `product.product` (variante) quando noto. */
  odooProductId: number | null
  /** ID Odoo `product.template` per link form prodotto Odoo. */
  odooTemplateId: number | null
}

export type OrdersAdminRelatedOrderDTO = {
  id: string
  orderStatus: string
  amountTotal: number | null
  paidAt: string | null
  lineItemCount: number
}

export type OrdersAdminCheckoutAttemptDTO = {
  attemptNo: number
  status: string
  provider: string | null
  failureReason: string | null
  createdAt: string
}

export type OrdersAdminPaymentDTO = {
  id: string
  method: string
  status: string
  amount: number
  createdAt: string
  capturedAt: string | null
  failedAt: string | null
  failureReason: string | null
}

export type OrdersAdminUxInsightDTO = {
  code: string
  severity: 'info' | 'warning' | 'success'
  title: string
  description: string
}

export type OrdersAdminDetailDTO = {
  id: string
  email: string
  orderStatus: string
  paymentStatus: string
  paymentMethod: string | null
  currencyCode: string
  amountTotal: number | null
  userId: string | null
  sessionId: string | null
  isGuest: boolean
  cartId: string | null
  checkoutSessionId: string | null
  odooPartnerId: number | null
  odooSaleOrderId: number | null
  odooLastSyncStatus: string | null
  providerTransactionId: string | null
  lastPaymentError: string | null
  createdAt: string
  checkoutStartedAt: string | null
  paymentStartedAt: string | null
  paidAt: string | null
  abandonedAt: string | null
  source: OrderAdminSource
  sourceLabel: string
  odooOrderName: string | null
  partnerName: string | null
  clientOrderRef: string | null
  isOdooOnly: boolean
  cart: {
    status: string
    estimatedTotal: number | null
    reservationExpiresAt: string | null
    abandonedAt: string | null
    createdAt: string
  } | null
  lines: OrdersAdminCartLineDTO[]
  checkoutAttempts: OrdersAdminCheckoutAttemptDTO[]
  payments: OrdersAdminPaymentDTO[]
  timeline: OrdersAdminTimelineEventDTO[]
  relatedOrders: OrdersAdminRelatedOrderDTO[]
  uxInsights: OrdersAdminUxInsightDTO[]
  odooSyncQueue: OdooSyncQueueItemDTO | null
}
