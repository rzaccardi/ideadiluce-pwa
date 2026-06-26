import { z } from 'zod'

export const odooAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  email: z.string().optional(),
  partnerId: z.coerce.number().int().positive().optional(),
  state: z.string().optional(),
  days: z.coerce.number().int().min(0).max(3650).optional(),
})

export const odooAdminPricelistQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
})

export const odooAdminQuotationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const odooAdminPricelistAssignmentSchema = z
  .object({
    pricelistId: z.coerce.number().int().positive(),
    partnerId: z.coerce.number().int().positive().optional(),
    email: z.string().email().optional(),
    userId: z.string().min(1).optional(),
  })
  .refine((v) => v.partnerId != null || v.email != null || v.userId != null, {
    message: 'Indica partnerId, email o userId',
  })

export const odooSyncQueueListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'EXHAUSTED']).optional(),
  pwaOrderId: z.string().min(1).optional(),
})

export const odooSyncQueueIdParamsSchema = z.object({
  id: z.string().min(1),
})
