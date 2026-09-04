import { z } from 'zod'
import { checkoutAddressSchema } from '../checkout/checkout-address.validators.js'

export const shippingAddressIdParamSchema = z.object({
  id: z.string().trim().min(1).max(64),
})

export const upsertShippingAddressSchema = checkoutAddressSchema
