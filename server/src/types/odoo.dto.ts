export type OdooOrderSource = 'pwa' | 'odoo_manual' | 'other_ecommerce' | 'odoo_historical'

export type OdooStatusDTO = {
  enabled: boolean
  configured: boolean
  mode: 'odoo18-xmlrpc'
  notes: string[]
  pingOk: boolean
  customFieldsAvailable?: string[]
}

export type OdooSaleOrderLineDTO = {
  id: number
  productId: number | null
  productName: string | null
  quantity: number
  unitPriceCents: number | null
  subtotalCents: number | null
}

export type OdooSaleDocumentDTO = {
  id: number
  name: string
  state: string
  dateOrder: string | null
  amountTotalCents: number | null
  amountUntaxedCents: number | null
  amountTaxCents: number | null
  currencyCode: string | null
  partnerId: number | null
  partnerName: string | null
  partnerEmail: string | null
  invoiceStatus: string | null
  validityDate: string | null
  commitmentDate: string | null
  clientOrderRef: string | null
  origin: string | null
  pricelistId: number | null
  pricelistName: string | null
  lineCount: number
  source: OdooOrderSource
  sourceLabel: string
}

export type OdooQuotationDetailDTO = OdooSaleDocumentDTO & {
  note: string | null
  lines: OdooSaleOrderLineDTO[]
}

export type OdooPricelistDTO = {
  id: number
  name: string
  active: boolean
  currencyCode: string | null
  companyName: string | null
  discountPolicy: string | null
  itemCount: number
}

export type OdooPartnerPricelistDTO = {
  partnerId: number
  partnerName: string | null
  partnerEmail: string | null
  pricelistId: number | null
  pricelistName: string | null
}

export type OdooPricelistAssignmentDTO = OdooPartnerPricelistDTO & {
  userId: string | null
  email: string | null
  localUserUpdated: boolean
}

export type OdooPaginatedDTO<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  configured: boolean
}

export type OdooSaleDocumentListQuery = {
  page: number
  pageSize: number
  q?: string
  email?: string
  partnerId?: number
  state?: string
  days?: number
}

export type OdooPricelistListQuery = {
  page: number
  pageSize: number
  q?: string
  active?: boolean
}

export type OdooSyncOperationDTO = 'FUNNEL_SYNC' | 'RECONCILE_LINES'

export type OdooSyncQueueItemDTO = {
  id: string
  pwaOrderId: string
  operation: OdooSyncOperationDTO
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'EXHAUSTED'
  attempts: number
  maxAttempts: number
  nextRetryAt: string
  lastError: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  orderEmail: string | null
  odooSaleOrderId: number | null
}

export type OdooSyncQueueListDTO = {
  items: OdooSyncQueueItemDTO[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  configured: boolean
}
