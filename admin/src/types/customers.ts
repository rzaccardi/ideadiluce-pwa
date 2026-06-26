export type CustomerAdminOrigin = 'both' | 'pwa_only' | 'odoo_only' | 'guest'

export type CustomerAdminOriginFilter =
  | 'all'
  | 'both'
  | 'pwa_only'
  | 'odoo_only'
  | 'guest'
  | 'ecommerce'

export type CustomersAdminListItem = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  displayName: string | null
  status: string | null
  customerSegment: string | null
  wishlistCount: number
  activeCartCount: number
  orderCount: number
  odooPartnerId: number | null
  origin: CustomerAdminOrigin
  originLabel: string
  tags: string[]
  isPwaAccount: boolean
  isOdooPartner: boolean
  isGuestCheckout: boolean
  pwaUserId: string | null
  odooPartnerUrl: string | null
  createdAt: string
}

export type CustomersAdminList = {
  items: CustomersAdminListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type CustomersAdminWishlistLine = {
  id: string
  productRef: string
  productSlug: string | null
  productName: string | null
  variantRef: string | null
  createdAt: string
}

export type CustomersAdminAbandonedEvent = {
  id: string
  cartId: string
  eventType: string
  contactEmail: string | null
  userId: string | null
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
}

export type CustomersAdminOdooProfile = {
  source: 'odoo' | 'none'
  odooPartnerId: number | null
  profile: {
    firstName: string
    lastName: string
    line1: string
    line2?: string
    city: string
    postalCode: string
    country: string
    phone?: string
  } | null
  notes: string[]
}

export type CustomersAdminRestockLine = {
  id: string
  productRef: string
  productSlug: string | null
  productName: string | null
  variantRef: string | null
  quantity: number
  locale: string
  notifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CustomersAdminDetail = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  status: string | null
  customerSegment: string | null
  odooPricelistId: number | null
  createdAt: string
  origin: CustomerAdminOrigin
  originLabel: string
  isPwaAccount: boolean
  isOdooPartner: boolean
  isGuestCheckout: boolean
  pwaUserId: string | null
  odooPartnerUrl: string | null
  odoo: CustomersAdminOdooProfile
  wishlist: CustomersAdminWishlistLine[]
  abandonedEvents: CustomersAdminAbandonedEvent[]
  restockRequests: CustomersAdminRestockLine[]
  recentOrders: Array<{
    id: string
    orderStatus: string
    paymentStatus: string
    amountTotal: number | null
    createdAt: string
  }>
  messageDraft: string
}

export type CustomersAdminAbandonedListItem = {
  id: string
  cartId: string
  eventType: string
  contactEmail: string | null
  userId: string | null
  userEmail: string | null
  itemCount: number
  createdAt: string
}

export type CustomersAdminAbandonedList = {
  items: CustomersAdminAbandonedListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
