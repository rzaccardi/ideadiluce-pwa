export type AbandonedCartsAdminListItem = {
  id: string
  cartId: string
  eventType: string
  contactEmail: string | null
  userId: string | null
  userEmail: string | null
  itemCount: number
  createdAt: string
}

export type AbandonedCartsAdminList = {
  items: AbandonedCartsAdminListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type AbandonedCartsAdminDetail = {
  id: string
  cartId: string
  eventType: string
  contactEmail: string | null
  userId: string | null
  userEmail: string | null
  itemCount: number
  lines: Array<{
    productRef: string
    productSlug: string | null
    productName: string | null
    variantRef: string | null
    quantity: number
    unitEstimateCents: number | null
  }>
  payloadJson: unknown
  createdAt: string
  cart: {
    status: string
    estimatedTotal: number | null
    createdAt: string
    abandonedAt: string | null
  } | null
}

export const ABANDONED_EVENT_LABELS: Record<string, string> = {
  reservation_expired: 'Riserva scaduta',
  checkout_timeout_abandoned: 'Checkout timeout',
  pwa_order_abandoned: 'Ordine abbandonato',
}
