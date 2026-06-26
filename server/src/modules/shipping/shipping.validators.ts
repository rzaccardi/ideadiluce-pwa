import { z } from 'zod'
import { checkoutAddressSchema } from '../checkout/checkout-address.validators.js'

export const addressSchema = checkoutAddressSchema

export const quotesSchema = z.object({
  shippingAddress: addressSchema,
})

export const selectSchema = z.object({
  shippingAddress: addressSchema,
  methodRef: z.string().min(1),
})

export type QuotesBody = z.infer<typeof quotesSchema>
export type SelectBody = z.infer<typeof selectSchema>
