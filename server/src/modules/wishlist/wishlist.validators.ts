import { z } from 'zod'

export const wishlistAddSchema = z.object({
  productRef: z.string().min(1),
  variantRef: z.string().optional().nullable(),
})
