import type { TestCheckoutAddressInput } from '../integrations/integrations.validators.js'
import type { PwaPaymentMethodDTO } from '../../types/dto.js'

export type CheckoutFiscalInput = {
  vatNumber?: string | null
  fiscalPositionId?: number | null
  vatWarningForced?: boolean | null
  viesName?: string | null
  viesAddress?: string | null
  viesValid?: boolean | null
  viesRequestDate?: string | null
}

export type CheckoutOrderLinesSnapshot = {
  lockedAt: string
  currencyCode: string
  items: Array<{
    itemId: string
    productRef: string
    variantRef: string | null
    quantity: number
    unitPriceCents: number
    lineTotalCents: number
  }>
  estimatedSubtotal: number
  estimatedTax: number
  estimatedShipping: number
  estimatedTotal: number
}

export type SyncSaleOrderDraftInput = {
  odooPartnerId: number
  odooSaleOrderId?: number | null
  pwaOrderId: string
  clientOrderRef?: string | null
  orderNotes?: string | null
  courierNotes?: string | null
  paymentMethod?: PwaPaymentMethodDTO | null
  billingAddress?: TestCheckoutAddressInput | null
  shippingAddress?: TestCheckoutAddressInput | null
  dropshipAddress?: TestCheckoutAddressInput | null
  fiscal?: CheckoutFiscalInput | null
  currencyCode: string
  lines: Array<{
    productRef: string
    variantRef?: string | null
    quantity: number
    unitPriceCents?: number
  }>
  shippingLine?: {
    label: string
    amountCents: number
    carrierCode?: string
    serviceCode?: string
  } | null
}

export const ACTIVE_DRAFT_ORDER_STATUSES = [
  'DRAFT',
  'CART_CREATED',
  'CHECKOUT_STARTED',
  'CHECKOUT_LOCKED',
  'PAYMENT_STARTED',
  'PAYMENT_PENDING',
  'PAYMENT_FAILED',
] as const

export const PRICE_LOCKED_ORDER_STATUSES = ['CHECKOUT_LOCKED', 'PAYMENT_STARTED', 'PAYMENT_PENDING'] as const
