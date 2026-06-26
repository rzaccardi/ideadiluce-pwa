import { z } from 'zod'

export const abandonedCartsAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  eventType: z.string().optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
})

export const abandonedCartsAdminIdParamsSchema = z.object({
  id: z.string().min(1),
})
