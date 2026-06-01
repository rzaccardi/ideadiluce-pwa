import { z } from 'zod'

/** Indirizzo per bridge test-checkout (allineato al client). */
export const testCheckoutAddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  /** Codice paese ISO 3166-1 alpha-2 (es. IT) */
  country: z.string().length(2).transform((c) => c.toUpperCase()),
  phone: z.string().optional(),
})

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
export type TestCheckoutAddressInput = z.infer<typeof testCheckoutAddressSchema>
export type OdooCustomerPrefillQuery = z.infer<typeof odooCustomerPrefillQuerySchema>
export type OdooPaymentUrlBody = z.infer<typeof odooPaymentUrlBodySchema>
