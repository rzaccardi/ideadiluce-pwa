import { z } from 'zod'
import { SITE_LOCALES } from '../site/site.constants.js'

export const siteGuidesPublicQuerySchema = z.object({
  locale: z.enum(SITE_LOCALES).optional().default('IT'),
  featured: z.enum(['true', 'false']).optional(),
})
