import { z } from 'zod'
import { MAIL_LOG_STATES } from './mail-log-admin.mapper.js'
import { PWA_MAIL_TEMPLATE_KEYS } from '../../adapters/odoo/odoo-mail.templates.js'

const stateFilterValues = ['all', ...MAIL_LOG_STATES, 'bounce'] as const
const templateFilterValues = ['all', ...PWA_MAIL_TEMPLATE_KEYS] as const

export const mailLogAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(120).optional(),
  state: z.enum(stateFilterValues).default('all'),
  templateKey: z.enum(templateFilterValues).default('all'),
})

export const mailLogAdminIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})
