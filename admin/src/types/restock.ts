export type StockRestockAdminStatus = 'NEW' | 'IN_PROGRESS' | 'HANDLED' | 'ARCHIVED'

export type RestockRequestType = 'RESTOCK_NOTIFY' | 'PRODUCT_REQUEST'

export type RestockAdminListItem = {
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
  requestType: RestockRequestType
  adminStatus: StockRestockAdminStatus
  adminNotes: string | null
  notifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export type RestockAdminList = {
  items: RestockAdminListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type RestockAdminDetail = RestockAdminListItem & {
  odooTemplateId: number | null
}

export type RestockAdminPatchInput = {
  adminStatus?: StockRestockAdminStatus
  adminNotes?: string | null
}
