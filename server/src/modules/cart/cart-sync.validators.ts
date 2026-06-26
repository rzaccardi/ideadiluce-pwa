import { z } from 'zod'

export const syncCartFromClientSchema = z.object({
  items: z
    .array(
      z.object({
        productRef: z.string().min(1),
        variantRef: z.string().optional().nullable(),
        quantity: z.coerce.number().int().min(1),
      }),
    )
    .default([]),
  expiresAt: z.string().datetime().optional().nullable(),
})
