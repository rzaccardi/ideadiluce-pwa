import { z } from 'zod'
import { SITE_LOCALES } from './site.constants.js'
import { isAllowedSitePageKey } from './site-content.defaults.js'

export const sitePageKeyParamSchema = z.object({
  pageKey: z.string().refine((value) => isAllowedSitePageKey(value), {
    message: 'Pagina sito non valida',
  }),
})

export const siteLocaleQuerySchema = z.object({
  locale: z.enum(SITE_LOCALES).optional().default('IT'),
  allLocales: z.enum(['1', 'true', '0', 'false']).optional(),
})

export const sitePagePatchSchema = z.object({
  content: z.unknown(),
  published: z.boolean().optional(),
  translateAllLocales: z.boolean().optional(),
})

export const sitePageTranslateSchema = z.object({
  content: z.unknown().optional(),
  sourceLocale: z.enum(SITE_LOCALES).optional(),
  onlyMissingLocales: z.boolean().optional(),
})

export const siteTranslateMissingSchema = z.object({
  pageKeys: z.array(sitePageKeyParamSchema.shape.pageKey).optional(),
  targetLocales: z.array(z.enum(SITE_LOCALES)).optional(),
})
