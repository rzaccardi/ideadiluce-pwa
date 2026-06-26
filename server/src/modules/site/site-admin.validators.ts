import { z } from 'zod'
import { SITE_LOCALES } from './site.constants.js'
import { SITE_PAGE_KEYS } from './site-content.defaults.js'

export const sitePageKeyParamSchema = z.object({
  pageKey: z
    .string()
    .refine((value) => SITE_PAGE_KEYS.includes(value as (typeof SITE_PAGE_KEYS)[number]), {
      message: 'Pagina sito non valida',
    }),
})

export const siteLocaleQuerySchema = z.object({
  locale: z.enum(SITE_LOCALES).optional().default('IT'),
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
