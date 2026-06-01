import { z } from 'zod'

export const addressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2),
  phone: z.string().optional(),
})

export const quotesSchema = z.object({
  shippingAddress: addressSchema,
})

export const selectSchema = z.object({
  shippingAddress: addressSchema,
  methodRef: z.string().min(1),
})

export type QuotesBody = z.infer<typeof quotesSchema>
export type SelectBody = z.infer<typeof selectSchema>
