import { z } from 'zod'
import { checkoutStartSchema, checkoutStartBodySchema } from '../checkout/checkout.validators.js'
import { checkoutAddressSchema } from '../checkout/checkout-address.validators.js'

export { checkoutStartSchema }

/** Metodi accettati in checkout produzione PWA (Stripe + bonifico). */
export const checkoutPaymentMethodSchema = z.enum(['stripe', 'bank_transfer'])

export const createPaymentSessionSchema = z.object({
  orderId: z.string().min(1),
  paymentMethod: checkoutPaymentMethodSchema,
})

export const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1),
  /**
   * Solo per sviluppo/provider stub: i webhook reali restano fonte autorevole.
   */
  mockStatus: z.enum(['captured', 'pending', 'failed', 'cancelled']).optional(),
})

export const prepareWalletCheckoutSchema = z.object({
  email: z.string().email().optional(),
  billingAddress: checkoutAddressSchema.optional(),
  shippingAddress: checkoutAddressSchema.optional(),
  productRef: z.string().min(1).optional(),
  quantity: z.coerce.number().int().min(1).optional(),
  variantRef: z.string().nullable().optional(),
})

export type CheckoutStartBody = z.infer<typeof checkoutStartBodySchema>
export type CreatePaymentSessionBody = z.infer<typeof createPaymentSessionSchema>
export type ConfirmPaymentBody = z.infer<typeof confirmPaymentSchema>
export type PrepareWalletCheckoutBody = z.infer<typeof prepareWalletCheckoutSchema>
