import { z } from 'zod'

export const addCartItemSchema = z.object({
  productRef: z.string().min(1),
  variantRef: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
})

export const patchCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1),
})
