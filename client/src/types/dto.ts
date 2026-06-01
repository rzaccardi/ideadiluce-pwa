/** Allineati ai DTO del backend — non usare shape Prisma/Odoo. */
export type ApiErrorDTO = {
  code: string
  message: string
  userMessage: string
  retriable: boolean
  correlationId: string
  details?: unknown
}

export type UserDTO = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  status: string
}

export type CategoryDTO = {
  id: string
  slug: string
  name: string
  parentId: string | null
}

export type ProductCardDTO = {
  slug: string
  name: string
  shortDescription: string | null
  priceCents: number
  currency: string
  imageUrl: string | null
  categorySlug: string | null
}

export type ProductVariantAttributeDTO = {
  name: string
  value: string
}

export type ProductVariantDTO = {
  ref: string
  label: string
  imageUrl: string | null
  attributes: ProductVariantAttributeDTO[]
}

export type PaginatedDTO<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type ProductListDTO = PaginatedDTO<ProductCardDTO>

export type ProductDetailDTO = ProductCardDTO & {
  longDescription: string | null
  sku: string | null
  inStock: boolean
  images: string[]
  variants: ProductVariantDTO[]
}

export type CartItemDTO = {
  id: string
  productRef: string
  variantRef: string | null
  quantity: number
  clientUnitPriceEstimateCents: number | null
  lineTotalEstimateCents: number | null
}

export type CartDTO = {
  id: string
  currencyCode: string
  status: string
  items: CartItemDTO[]
  estimatedSubtotal: number | null
  estimatedTax: number | null
  estimatedShipping: number | null
  estimatedTotal: number | null
  itemCount: number
}

export type WishlistItemDTO = {
  id: string
  productRef: string
  variantRef: string | null
}

export type CheckoutSessionDTO = {
  id: string
  cartId: string
  state: string
  email: string
  paymentRedirectUrl: string | null
  expiresAt: string | null
}

export type PaymentUrlDTO = {
  paymentUrl: string
}

export type PwaOrderStatusDTO =
  | 'cart_created'
  | 'checkout_started'
  | 'payment_started'
  | 'payment_pending'
  | 'paid'
  | 'payment_failed'
  | 'abandoned'
  | 'cancelled'
  | 'confirmed'
  | 'completed'

export type PwaPaymentStatusDTO =
  | 'not_started'
  | 'created'
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'cancelled'
  | 'refunded'

export type PwaPaymentMethodDTO = 'card_nexi' | 'bank_transfer' | 'paypal' | 'google_pay' | 'stripe'

export type ShippingQuoteDTO = {
  methodRef: string
  carrierCode: string
  serviceCode: string
  label: string
  amountCents: number
  currencyCode: string
  etaDays: number | null
  source: 'flat' | 'free' | 'dhl' | 'fedex'
}

export type CheckoutStartDTO = {
  orderId: string
  checkoutSessionId: string
  cartId: string
  odooSaleOrderId: number | null
  orderStatus: PwaOrderStatusDTO
  paymentStatus: PwaPaymentStatusDTO
  currencyCode: string
  amountTotal: number | null
}

export type PaymentSessionDTO = {
  paymentId: string
  orderId: string
  method: PwaPaymentMethodDTO
  status: PwaPaymentStatusDTO
  provider: string
  amount: number
  currencyCode: string
  redirectUrl: string | null
  clientSecret: string | null
  instructions: Record<string, unknown> | null
}

export type PaymentConfirmDTO = {
  orderId: string
  paymentId: string
  orderStatus: PwaOrderStatusDTO
  paymentStatus: PwaPaymentStatusDTO
}

export type PwaOrderStatusResponseDTO = {
  orderId: string
  cartId: string
  odooSaleOrderId: number | null
  orderStatus: PwaOrderStatusDTO
  paymentStatus: PwaPaymentStatusDTO
  paymentMethod: PwaPaymentMethodDTO | null
  amountTotal: number | null
  currencyCode: string
  lastPaymentError: string | null
}

/** totalAmount in centesimi (minor units), coerente con CartDTO e formatMoney lato client. */
export type OrderDTO = {
  id: string
  pwaOrderId: string | null
  /** Identificativo ordine nel gestionale (esposto dal backend come DTO, non shape DB grezza). */
  odooSaleOrderId: number
  status: string
  paymentStatus: string | null
  currencyCode: string | null
  totalAmount: number | null
  createdAt: string
  odooPortalUrl: string | null
}
