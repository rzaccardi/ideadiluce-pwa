/**
 * DTO client per POST /api/v1/integrations/odoo/test-checkout.
 * Mirror: `server/src/types/integrations.dto.ts`
 */

export type AddressInput = {
  firstName: string
  lastName: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  /** ISO 3166-1 alpha-2 */
  country: string
  phone?: string
}

export type TestCheckoutInput = {
  cartId: string
  email: string
  billingAddress: AddressInput
  shippingAddress: AddressInput
}

export type CheckoutCartSnapshotItem = {
  id: string
  productRef: string
  variantRef: string | null
  quantity: number
  clientUnitPriceEstimateCents: number | null
}

export type CheckoutCartSnapshot = {
  cartId: string
  currencyCode: string
  status: string
  itemCount: number
  items: ReadonlyArray<CheckoutCartSnapshotItem>
}

export type CheckoutOdooSummary = {
  partnerId: number
  saleOrderId: number
  providerRef?: string
}

export type CheckoutDebugLegacyFields = {
  cartItemCount: number
  paymentDebug?: Record<string, unknown>
}

export type CheckoutDebugSummary = {
  requestMode: 'mock' | 'real'
  correlationId: string
  checkoutSessionId?: string
  cartSnapshot: CheckoutCartSnapshot
  odooSummary: CheckoutOdooSummary
  notes: ReadonlyArray<string>
  legacyFields?: CheckoutDebugLegacyFields
}

export type TestCheckoutResponse = {
  success: boolean
  odooPartnerId: string | null
  odooSaleOrderId: string | null
  checkoutState: string
  redirectUrl: string | null
  rawDebugSummary: CheckoutDebugSummary
}

export type OdooCustomerPrefill = {
  source: 'odoo' | 'none'
  profile: AddressInput | null
  notes: string[]
}
