import { z } from 'zod'

export const stockRestockRequestSchema = z.object({
  email: z.string().email().max(320),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  variantRef: z.string().optional().nullable(),
  requestType: z.enum(['RESTOCK_NOTIFY', 'PRODUCT_REQUEST']).default('RESTOCK_NOTIFY'),
})
