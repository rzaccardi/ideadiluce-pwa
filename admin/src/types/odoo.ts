export type OdooOrderSource = 'pwa' | 'odoo_manual' | 'other_ecommerce' | 'odoo_historical'

export type OdooStatus = {
  enabled: boolean
  configured: boolean
  mode: 'odoo18-xmlrpc'
  notes: string[]
  pingOk: boolean
  customFieldsAvailable?: string[]
}

export type OdooSaleDocument = {
  id: number
  name: string
  state: string
  dateOrder: string | null
  amountTotalCents: number | null
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

export type OdooQuotationLine = {
  id: number
  productId: number | null
  productName: string | null
  quantity: number
  unitPriceCents: number | null
  subtotalCents: number | null
}

export type OdooQuotationDetail = OdooSaleDocument & {
  note: string | null
  lines: OdooQuotationLine[]
}

export type OdooPricelist = {
  id: number
  name: string
  active: boolean
  currencyCode: string | null
  companyName: string | null
  discountPolicy: string | null
  itemCount: number
}

export type OdooPaginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  configured: boolean
}

export type OdooPricelistAssignment = {
  partnerId: number
  partnerName: string | null
  partnerEmail: string | null
  pricelistId: number | null
  pricelistName: string | null
  userId: string | null
  email: string | null
  localUserUpdated: boolean
}

export type OdooSyncOperation = 'FUNNEL_SYNC' | 'RECONCILE_LINES'

export type OdooSyncQueueItem = {
  id: string
  pwaOrderId: string
  operation: OdooSyncOperation
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

export type OdooSyncQueueList = {
  items: OdooSyncQueueItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  configured: boolean
}
