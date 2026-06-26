import { z } from 'zod'
import { checkoutStartBodySchema } from './checkout.validators.js'

export const checkoutDraftSchema = checkoutStartBodySchema
  .partial({
    email: true,
    billingAddress: true,
    shippingAddress: true,
  })
  .extend({
    step: z.enum(['details', 'shipping', 'payment_method', 'lock']),
    orderId: z.string().min(1).optional(),
    paymentMethod: z.enum(['card_nexi', 'bank_transfer', 'paypal', 'google_pay', 'stripe']).optional(),
  })

export type CheckoutDraftBody = z.infer<typeof checkoutDraftSchema>
