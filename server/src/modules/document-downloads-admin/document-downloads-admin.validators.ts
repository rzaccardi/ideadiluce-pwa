import { z } from 'zod'

export const documentDownloadsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().optional(),
  productSlug: z.string().trim().optional(),
})
