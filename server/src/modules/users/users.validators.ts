import { z } from 'zod'
import { addressSchema } from '../shipping/shipping.validators.js'

export const patchMeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  shippingAddress: addressSchema.optional().nullable(),
  preferredPaymentMethod: z
    .enum(['card_nexi', 'bank_transfer', 'paypal', 'google_pay', 'stripe'])
    .optional()
    .nullable(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})
