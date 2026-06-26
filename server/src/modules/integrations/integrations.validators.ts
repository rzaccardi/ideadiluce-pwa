import { z } from 'zod'
import {
  checkoutAddressSchema,
  type CheckoutAddressInput,
} from '../checkout/checkout-address.validators.js'

/** Indirizzo checkout (allineato al client). */
export const testCheckoutAddressSchema = checkoutAddressSchema
export type TestCheckoutAddressInput = CheckoutAddressInput

export const odooTestCheckoutBodySchema = z.object({
  cartId: z.string().min(1),
  email: z.string().email(),
  billingAddress: testCheckoutAddressSchema,
  shippingAddress: testCheckoutAddressSchema,
})

export const odooCustomerPrefillQuerySchema = z.object({
  email: z.string().email(),
})

export const odooPaymentUrlBodySchema = z.object({
  documentModel: z.enum(['sale.order', 'account.move']),
  documentId: z.coerce.number().int().positive(),
})

export type OdooTestCheckoutBody = z.infer<typeof odooTestCheckoutBodySchema>
export type OdooCustomerPrefillQuery = z.infer<typeof odooCustomerPrefillQuerySchema>
export type OdooPaymentUrlBody = z.infer<typeof odooPaymentUrlBodySchema>
