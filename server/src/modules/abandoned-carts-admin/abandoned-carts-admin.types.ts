export type AbandonedCartsAdminListItemDTO = {
  id: string
  cartId: string
  eventType: string
  contactEmail: string | null
  userId: string | null
  userEmail: string | null
  itemCount: number
  createdAt: string
}

export type AbandonedCartsAdminListDTO = {
  items: AbandonedCartsAdminListItemDTO[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type AbandonedCartsAdminLineDTO = {
  productRef: string
  productSlug: string | null
  productName: string | null
  variantRef: string | null
  quantity: number
  unitEstimateCents: number | null
}

export type AbandonedCartsAdminDetailDTO = {
  id: string
  cartId: string
  eventType: string
  contactEmail: string | null
  userId: string | null
  userEmail: string | null
  itemCount: number
  lines: AbandonedCartsAdminLineDTO[]
  payloadJson: unknown
  createdAt: string
  cart: {
    status: string
    estimatedTotal: number | null
    createdAt: string
    abandonedAt: string | null
  } | null
}
