import { z } from 'zod'
import { SITE_INQUIRY_KINDS, SITE_INQUIRY_STATUSES } from './site-inquiries-admin.constants.js'

const statusFilterValues = ['all', ...SITE_INQUIRY_STATUSES] as const
const kindFilterValues = ['all', ...SITE_INQUIRY_KINDS] as const

export const siteInquiriesAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(120).optional(),
  status: z.enum(statusFilterValues).default('all'),
  kind: z.enum(kindFilterValues).default('all'),
  days: z.coerce.number().int().min(1).max(365).optional(),
})

export const siteInquiriesAdminIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const siteInquiriesAdminPatchSchema = z
  .object({
    status: z.enum(SITE_INQUIRY_STATUSES).optional(),
    adminNotes: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((body) => body.status !== undefined || body.adminNotes !== undefined, {
    message: 'Specificare status o adminNotes',
  })
