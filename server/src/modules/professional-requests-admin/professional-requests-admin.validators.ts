import { z } from 'zod'
import { PROFESSIONAL_REQUEST_STATUSES } from '../professional-account/professional-account.constants.js'

const statusFilterValues = ['all', ...PROFESSIONAL_REQUEST_STATUSES] as const

export const professionalRequestsAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(120).optional(),
  status: z.enum(statusFilterValues).default('all'),
  days: z.coerce.number().int().min(1).max(365).optional(),
})

export const professionalRequestsAdminIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const professionalRequestsAdminStatusSchema = z.object({
  status: z.enum(PROFESSIONAL_REQUEST_STATUSES),
})

export const professionalRequestsAdminPatchSchema = z
  .object({
    status: z.enum(PROFESSIONAL_REQUEST_STATUSES).optional(),
    adminNotes: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((body) => body.status !== undefined || body.adminNotes !== undefined, {
    message: 'Specificare status o adminNotes',
  })
