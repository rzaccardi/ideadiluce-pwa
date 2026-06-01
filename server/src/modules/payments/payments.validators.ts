import { z } from 'zod'
import { testCheckoutAddressSchema } from '../integrations/integrations.validators.js'

export const checkoutStartSchema = z.object({
  email: z.string().email(),
  billingAddress: testCheckoutAddressSchema,
  shippingAddress: testCheckoutAddressSchema,
})

export const createPaymentSessionSchema = z.object({
  orderId: z.string().min(1),
  paymentMethod: z.enum(['card_nexi', 'bank_transfer', 'paypal', 'google_pay', 'stripe']),
})

export const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1),
  /**
   * Solo per sviluppo/provider stub: i webhook reali restano fonte autorevole.
   */
  mockStatus: z.enum(['captured', 'pending', 'failed', 'cancelled']).optional(),
})

export type CheckoutStartBody = z.infer<typeof checkoutStartSchema>
export type CreatePaymentSessionBody = z.infer<typeof createPaymentSessionSchema>
export type ConfirmPaymentBody = z.infer<typeof confirmPaymentSchema>

