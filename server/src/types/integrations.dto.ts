/**
 * DTO risposta POST /api/v1/integrations/odoo/test-checkout (mirror client `types/integrations.ts`).
 * Solo tipi serializzabili JSON.
 */

export type TestCheckoutAddressDTO = {
  firstName: string
  lastName: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
  phone?: string
}

export type TestCheckoutCartSnapshotItemDTO = {
  id: string
  productRef: string
  variantRef: string | null
  quantity: number
  clientUnitPriceEstimateCents: number | null
}

export type TestCheckoutCartSnapshotDTO = {
  cartId: string
  currencyCode: string
  status: string
  itemCount: number
  items: TestCheckoutCartSnapshotItemDTO[]
}

export type TestCheckoutOdooSummaryDTO = {
  partnerId: number
  saleOrderId: number
  providerRef?: string
}

export type TestCheckoutDebugLegacyDTO = {
  cartItemCount: number
  paymentDebug?: Record<string, unknown>
}

export type TestCheckoutDebugSummaryDTO = {
  requestMode: 'mock' | 'real'
  correlationId: string
  checkoutSessionId?: string
  cartSnapshot: TestCheckoutCartSnapshotDTO
  odooSummary: TestCheckoutOdooSummaryDTO
  notes: string[]
  legacyFields?: TestCheckoutDebugLegacyDTO
}

export type TestCheckoutResponseDTO = {
  success: boolean
  odooPartnerId: string | null
  odooSaleOrderId: string | null
  checkoutState: string
  redirectUrl: string | null
  rawDebugSummary: TestCheckoutDebugSummaryDTO
}

export type OdooCustomerPrefillDTO = {
  source: 'odoo' | 'none'
  profile: TestCheckoutAddressDTO | null
  notes: string[]
}
