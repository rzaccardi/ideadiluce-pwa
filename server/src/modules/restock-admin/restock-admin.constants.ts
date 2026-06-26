/** Stati workflow BO — string literal (coerente con ProfessionalAccountRequest.status). */
export const STOCK_RESTOCK_ADMIN_STATUSES = [
  'NEW',
  'IN_PROGRESS',
  'HANDLED',
  'ARCHIVED',
] as const

export type StockRestockAdminStatus = (typeof STOCK_RESTOCK_ADMIN_STATUSES)[number]

export const STOCK_REQUEST_TYPES = ['RESTOCK_NOTIFY', 'PRODUCT_REQUEST'] as const

export type StockRequestTypeFilter = (typeof STOCK_REQUEST_TYPES)[number]
