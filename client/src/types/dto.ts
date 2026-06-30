/** Allineati ai DTO del backend — non usare shape Prisma/Odoo. */
export type ApiErrorDTO = {
  code: string
  message: string
  userMessage: string
  retriable: boolean
  correlationId: string
  details?: unknown
}

export type UserAddressDTO = {
  firstName: string
  lastName: string
  line1: string
  streetNumber?: string
  isSnc?: boolean
  line2?: string
  city: string
  postalCode: string
  /** ISO 3166-1 alpha-2 */
  country: string
  phone?: string
  courierNotes?: string
}

export type CustomerSegmentDTO = 'retail' | 'business' | 'professional'

export type PriceDisplayModeDTO = 'ex_vat'

export type UserDTO = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  shippingAddress: UserAddressDTO | null
  preferredPaymentMethod: PwaPaymentMethodDTO | null
  status: string
  customerSegment: CustomerSegmentDTO
  pricelistLabel: string
  /** Account con condizioni listino professional (segmento PROFESSIONAL). */
  isProfessional: boolean
  companyName: string | null
  vatNumber: string | null
  fiscalCode: string | null
  pec: string | null
  sdiCode: string | null
  vatCountryCode: string | null
  vatFormatValid: boolean | null
  vatChecksumValid: boolean | null
  fiscalCodeValid: boolean | null
  viesValid: boolean | null
  viesName: string | null
  viesAddress: string | null
  taxValidationStatus: string | null
  taxCheckedAt: string | null
  /** Partner Odoo collegato (listini e disponibilità B2B). */
  odooPartnerId: number | null
  /** Listino Odoo assegnato all'account. */
  odooPricelistId: number | null
}

export type ProfessionalRequestSummaryDTO = {
  id: string
  status: 'NEW' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED' | string
  companyName: string
  createdAt: string
}

export type UserPatchResponseDTO = {
  user: UserDTO
  odooSyncFailed: boolean
}

export type ImpersonationInfoDTO = {
  adminEmail: string
  adminDisplayName: string | null
}

export type AuthMeDTO = {
  user: UserDTO
  impersonation: ImpersonationInfoDTO | null
}

export type AuthRefreshDTO = {
  user: UserDTO | null
  impersonation: ImpersonationInfoDTO | null
  expiresAt: string
}

export type CategoryDTO = {
  id: string
  slug: string
  name: string
  parentId: string | null
}

export type CategoryDetailDTO = CategoryDTO & {
  locale: string
  description: string | null
  productCount: number
  seo: ProductSeoDTO
}

export type ProductSeoDTO = {
  metaTitle: string | null
  metaDescription: string | null
  canonical: string | null
  noindex: boolean
}

export type ProductAlternateDTO = {
  locale: string
  href: string
}

export type ProductCategoryRefDTO = {
  slug: string
  name: string
}

export type ProductBrandDTO = {
  slug: string
  name: string
}

/** Disponibilità (input per utility, non stato UI). */
export type ProductAvailabilityDataDTO = {
  qtyAvailable: number
  isOrderable: boolean
  restockDate?: string | null
  customerLeadTimeDays?: number | null
  isUnrecoverable?: boolean
}

export type ProductDocumentDTO = {
  id: string
  name: string
  type?: string | null
  format?: string | null
  sizeBytes?: number | null
  url: string
}

export type ProductRelatedDTO = ProductCardDTO & {
  relation: 'related' | 'accessory' | 'alternative'
}

export type ProductCardDTO = {
  slug: string
  locale: string
  name: string
  shortDescription: string | null
  /** Chip tecnici per card catalogo (attacco, potenza, tensione, IP…). */
  specTags?: readonly string[]
  /** Prezzo unitario netto IVA esclusa (centesimi EUR). */
  priceCents: number
  priceDisplayMode: PriceDisplayModeDTO
  currency: string
  imageUrl: string | null
  categorySlug: string | null
  brand?: ProductBrandDTO | null
  sku?: string | null
  /** ID Odoo `product.template` (da catalogo BFF, per add-to-cart senza Arfly). */
  odooTemplateId?: number | null
  inStock?: boolean
  availability?: ProductAvailabilityDataDTO
}

export type StockRestockRequestDTO = {
  id: string
  email: string
  productRef: string
  variantRef: string | null
  quantity: number
  productName: string | null
  requestType?: 'RESTOCK_NOTIFY' | 'PRODUCT_REQUEST'
  createdAt: string
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
  odooVariantId?: number | null
  /** Prezzo unitario netto IVA esclusa (centesimi EUR). */
  priceCents?: number
  priceDisplayMode?: PriceDisplayModeDTO
  inStock?: boolean
  stockQty?: number | null
  availability?: ProductAvailabilityDataDTO
  ean?: string | null
  documents?: ProductDocumentDTO[]
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

export type ProductListDTO = PaginatedDTO<ProductCardDTO> & {
  nextInStockSkip?: number
}

export type ProductDetailDTO = ProductCardDTO & {
  longDescription: string | null
  additionalInfoTableHtml?: string | null
  specsTableHtml?: string | null
  sku: string | null
  inStock: boolean
  images: string[]
  categories?: ProductCategoryRefDTO[]
  brand?: ProductBrandDTO | null
  odooTemplateId?: number | null
  variants: ProductVariantDTO[]
  seo: ProductSeoDTO
  alternates: ProductAlternateDTO[]
  documents?: ProductDocumentDTO[]
  relatedProducts?: ProductRelatedDTO[]
  accessories?: ProductRelatedDTO[]
  alternatives?: ProductRelatedDTO[]
  ean?: string | null
  weightKg?: number | null
  lengthMeters?: number | null
  dimensions?: { lengthCm?: number; widthCm?: number; heightCm?: number }
  priceLabel?: 'excl_vat'
}

export type ProductSocialProofEventDTO = {
  buyerLabel: string
  quantity: number
  purchasedAt: string
  source?: 'pwa' | 'odoo'
}

export type ProductSocialProofDTO = {
  enabled: boolean
  productName?: string
  events: ProductSocialProofEventDTO[]
  buyersLast30Days: number
  unitsSoldLast30Days: number
  minQuantity?: number
}

export type CartLineAvailabilityDTO = {
  state: 'available' | 'orderable' | 'out_of_stock'
  stockQty: number | null
  effectiveLeadDays: number | null
  warning: string | null
}

export type CartLineAvailabilityStatusDTO = 'available' | 'blocked' | 'limited'

export type CartLineBlockReasonDTO = 'out_of_stock' | 'discontinued' | 'price_unavailable'

export type CartItemDTO = {
  id: string
  productRef: string
  variantRef: string | null
  quantity: number
  clientUnitPriceEstimateCents: number | null
  lineTotalEstimateCents: number | null
  productSlug: string | null
  productName: string | null
  imageUrl: string | null
  purchasable: boolean
  availabilityStatus: CartLineAvailabilityStatusDTO
  blockReason?: CartLineBlockReasonDTO
  priceChanged?: boolean
  availability: CartLineAvailabilityDTO
}

export type CartReservationDTO = {
  enabled: boolean
  startedAt: string | null
  expiresAt: string | null
  expiresInSeconds: number | null
  elapsedSeconds: number | null
  expired: boolean
  ttlMinutes: number
}

export type FreeShippingHintDTO = {
  thresholdCents: number
  remainingCents: number
  eligible: boolean
  label: string
}

export type TaxBreakdownDTO = {
  netCents: number
  taxCents: number
  taxRatePct: number
  taxLabel: string
  grossCents: number
  isEstimate: boolean
  disclaimerKey?: string
  ruleId?: string
  odooFiscalPositionId?: number | null
}

export type ViesValidationStatusDTO =
  | 'valid'
  | 'invalid'
  | 'service_unavailable'
  | 'not_checked'

export type TaxValidationResultDTO = {
  fiscalCode: {
    input: string
    normalized: string
    valid: boolean
    errors: string[]
  } | null
  vat: {
    input: string
    countryCode: string
    normalized: string
    formatValid: boolean
    checksumValid: boolean
    vies: {
      checked: boolean
      valid: boolean | null
      name: string | null
      address: string | null
      requestDate: string | null
      status: ViesValidationStatusDTO
    }
    autofill: {
      companyName: string | null
      billingLine1: string | null
      billingLine2: string | null
      billingCity: string | null
      billingPostalCode: string | null
    }
    errors: string[]
  } | null
  taxValidationStatus: 'pending' | 'valid' | 'invalid' | 'vies_unavailable'
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
  purchasableItemCount: number
  warnings: string[]
  deliveryLeadDays: number | null
  deliveryEstimateDays: number | null
  repricedAt: string | null
  reservation: CartReservationDTO
  freeShippingHint?: FreeShippingHintDTO | null
  taxBreakdown?: TaxBreakdownDTO | null
  taxEstimateNote?: string | null
}

export type CartStockInsufficientDTO = {
  productRef: string
  productSlug: string | null
  productName: string | null
  requested: number
  available: number
  availabilityStatus: CartLineAvailabilityStatusDTO
  blockReason?: CartLineBlockReasonDTO
}

export type CartStockCheckDTO = {
  ok: boolean
  insufficient: CartStockInsufficientDTO[]
}

export type WishlistItemDTO = {
  id: string
  productRef: string
  variantRef: string | null
}

export type QuoteRequestStatusDTO =
  | 'draft'
  | 'requested'
  | 'sent'
  | 'checkout_started'
  | 'converted'
  | 'cancelled'

export type QuoteRequestDTO = {
  id: string
  status: QuoteRequestStatusDTO
  email: string
  currencyCode: string
  estimatedSubtotal: number | null
  estimatedTax: number | null
  estimatedTotal: number | null
  odooSaleOrderId: number | null
  pwaOrderId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  payable?: boolean
  payableReason?: 'payable' | 'expired' | 'not_sent' | 'cancelled' | 'converted' | 'draft'
  expired?: boolean
  validityDate?: string | null
  odooReference?: string | null
  source?: 'pwa' | 'odoo'
}

export type QuoteLineDTO = {
  productRef: string
  variantRef: string | null
  productName: string
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
}

export type QuoteDetailDTO = QuoteRequestDTO & {
  billingAddress: UserAddressDTO | null
  shippingAddress: UserAddressDTO | null
  lines: QuoteLineDTO[]
  frozen: boolean
}

export type QuoteCheckoutDTO = {
  quoteId: string
  orderId: string
  checkoutSessionId: string
  orderStatus: PwaOrderStatusDTO
}

export type InvoiceDTO = {
  id: string
  name: string
  state: string
  paymentState: string | null
  currencyCode: string | null
  amountTotalCents: number | null
  invoiceDate: string | null
  pdfAvailable: boolean
  portalUrl?: string | null
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
  | 'draft'
  | 'checkout_started'
  | 'checkout_locked'
  | 'payment_started'
  | 'payment_pending'
  | 'paid'
  | 'paid_sync_pending'
  | 'synced'
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

export type ShippingSurchargeAppliedDTO = {
  code: string
  label: string
  amountCents: number
}

export type ShippingQuoteDTO = {
  methodRef: string
  carrierCode: string
  serviceCode: string
  label: string
  amountCents: number
  currencyCode: string
  etaDays: number | null
  source: 'flat' | 'free' | 'dhl' | 'fedex' | 'pickup'
}

export type ShippingQuotesResponseDTO = {
  quotes: ShippingQuoteDTO[]
  freeShippingHint: FreeShippingHintDTO | null
  surchargesApplied: ShippingSurchargeAppliedDTO[]
  deliveryEstimateDays: number | null
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

export type StripeClientConfigDTO = {
  enabled: boolean
  publishableKey: string | null
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
  publishableKey: string | null
  instructions: Record<string, unknown> | null
}

export type PaymentConfirmDTO = {
  orderId: string
  paymentId: string
  orderStatus: PwaOrderStatusDTO
  paymentStatus: PwaPaymentStatusDTO
}

export type BankTransferInstructionsDTO = {
  holder: string
  iban: string
  bankName: string | null
  reference: string
  amount: number
  currencyCode: string
  note: string
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
  bankTransferInstructions: BankTransferInstructionsDTO | null
}

export type ThankYouOrderDTO = PwaOrderStatusResponseDTO & {
  displayOrderNumber: string
  email: string
  customerFirstName: string | null
  createdAt: string
  paidAt: string | null
  shippingAddress: UserAddressDTO | null
  lines: OrderLineDTO[]
  subtotalCents: number | null
  shippingCents: number | null
  taxCents: number | null
  taxLabel: string | null
  disclaimerKey?: string | null
  shippingMethodRef: string | null
  isStorePickup: boolean
}

/** totalAmount in centesimi (minor units), coerente con CartDTO e formatMoney lato client. */
export type OrderSourceDTO = 'pwa' | 'odoo_manual' | 'other_ecommerce' | 'odoo_historical'

export const ORDER_SOURCE_LABEL: Record<OrderSourceDTO, string> = {
  pwa: 'E-commerce',
  odoo_manual: 'Odoo manuale',
  other_ecommerce: 'Altro canale',
  odoo_historical: 'Storico',
}

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
  source: OrderSourceDTO
  sourceLabel: string
}

export type OrderLineDTO = {
  productRef: string
  variantRef: string | null
  quantity: number
  productSlug: string | null
  productName: string | null
  imageUrl: string | null
  unitPriceCents: number | null
  lineTotalCents: number | null
}

export type OrderDetailDTO = OrderDTO & {
  lines: OrderLineDTO[]
  lineCount: number
  isSingleItem: boolean
}

export type OrderReorderResultDTO = {
  added: number
  skipped: Array<{ productRef: string; reason: string }>
  cart: CartDTO
}

export type QuickReorderMatchTypeDTO =
  | 'odoo_barcode'
  | 'odoo_sku'
  | 'arfly_ean'
  | 'arfly_sku'
  | 'arfly_mpn'
  | 'arfly_variant_id'
  | 'arfly_template_id'

export type ResolvedCodeLineDTO = {
  code: string
  quantity: number
  productRef: string
  variantRef: string | null
  productName: string
  variantLabel?: string | null
  imageUrl?: string | null
  matchType: QuickReorderMatchTypeDTO
}

export type UnresolvedCodeLineDTO = {
  code: string
  quantity: number
  reason: string
}

export type ResolveCodesResultDTO = {
  matched: ResolvedCodeLineDTO[]
  unmatched: UnresolvedCodeLineDTO[]
}

export type QuickReorderResultDTO = OrderReorderResultDTO & ResolveCodesResultDTO
