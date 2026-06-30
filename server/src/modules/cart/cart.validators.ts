import { z } from 'zod'

export const cartAddProductHintSchema = z.object({
  odooTemplateId: z.number().int().positive(),
  odooVariantId: z.number().int().positive().optional().nullable(),
  slug: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  imageUrl: z.string().nullable().optional(),
  unitPriceCents: z.number().int().min(0).optional(),
})

export type CartAddProductHint = z.infer<typeof cartAddProductHintSchema>

export const addCartItemSchema = z.object({
  productRef: z.string().min(1),
  variantRef: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  productHint: cartAddProductHintSchema.optional(),
})

export const patchCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1),
})
