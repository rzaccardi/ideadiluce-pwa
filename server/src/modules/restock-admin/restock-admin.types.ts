import type { StockRestockAdminStatus } from './restock-admin.constants.js'

export type RestockAdminListItemDTO = {
  id: string
  email: string
  productRef: string
  productSlug: string | null
  productName: string | null
  variantRef: string | null
  quantity: number
  locale: string
  userId: string | null
  userEmail: string | null
  requestType: 'RESTOCK_NOTIFY' | 'PRODUCT_REQUEST'
  adminStatus: StockRestockAdminStatus
  adminNotes: string | null
  notifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export type RestockAdminListDTO = {
  items: RestockAdminListItemDTO[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type RestockAdminDetailDTO = RestockAdminListItemDTO & {
  odooTemplateId: number | null
}
