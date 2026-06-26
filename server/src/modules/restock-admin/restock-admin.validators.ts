import { z } from 'zod'
import { STOCK_REQUEST_TYPES, STOCK_RESTOCK_ADMIN_STATUSES } from './restock-admin.constants.js'

export const restockAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().optional(),
  /** Legacy: pending = non notificato; notified = notifiedAt impostato */
  status: z.enum(['all', 'pending', 'notified']).default('all'),
  requestType: z.enum(['all', ...STOCK_REQUEST_TYPES]).default('all'),
  adminStatus: z.enum(['all', ...STOCK_RESTOCK_ADMIN_STATUSES]).default('all'),
})

export const restockAdminIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const restockAdminPatchSchema = z
  .object({
    adminStatus: z.enum(STOCK_RESTOCK_ADMIN_STATUSES).optional(),
    adminNotes: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((b) => b.adminStatus !== undefined || b.adminNotes !== undefined, {
    message: 'Specificare adminStatus o adminNotes',
  })
