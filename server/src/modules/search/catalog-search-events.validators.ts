import { z } from 'zod'

export const catalogSearchEventBodySchema = z.object({
  query: z.string().trim().min(1).max(120),
  locale: z.string().trim().max(8).optional(),
  source: z
    .enum(['palette', 'hero', 'catalog', 'brand', 'attacco', 'inline'])
    .default('inline'),
  action: z.enum(['submit', 'suggest_pick', 'view_all']).default('submit'),
  resultCount: z.number().int().min(0).max(10_000).optional().nullable(),
  productTotal: z.number().int().min(0).max(1_000_000).optional().nullable(),
  clickedPath: z.string().trim().max(500).optional().nullable(),
  clickedKind: z
    .enum(['attacco', 'brand', 'category', 'product', 'hint', 'query'])
    .optional()
    .nullable(),
  clickedLabel: z.string().trim().max(200).optional().nullable(),
})

export const searchAnalyticsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  days: z.coerce.number().int().min(1).max(365).default(30),
  q: z.string().trim().optional(),
  locale: z.string().trim().max(8).optional(),
  source: z.string().trim().optional(),
  action: z.string().trim().optional(),
})

export const searchAnalyticsStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  locale: z.string().trim().max(8).optional(),
})
