import { z } from 'zod'
import { NOT_FOUND_PATH_KINDS, NOT_FOUND_REFERRER_KINDS } from './not-found.normalize.js'

const boolQuery = (fallback: boolean) =>
  z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((value) => (value == null ? fallback : value === 'true' || value === '1'))

export const notFoundEventBodySchema = z.object({
  path: z.string().trim().min(1).max(2000),
  queryString: z.string().trim().max(500).optional().nullable(),
  referrer: z.string().trim().max(1000).optional().nullable(),
  locale: z.string().trim().max(8).optional(),
})

export const notFoundAdminStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  hideBots: boolQuery(false),
  hideProbes: boolQuery(true),
})

export const notFoundAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  days: z.coerce.number().int().min(1).max(365).default(30),
  q: z.string().trim().max(200).optional(),
  hideBots: boolQuery(false),
  hideProbes: boolQuery(true),
  referrerKind: z.enum(['all', ...NOT_FOUND_REFERRER_KINDS]).default('all'),
  pathKind: z.enum(['all', ...NOT_FOUND_PATH_KINDS]).default('all'),
})

export const notFoundAdminHitsQuerySchema = z.object({
  path: z.string().trim().min(1).max(500),
  days: z.coerce.number().int().min(1).max(365).default(30),
  hideBots: boolQuery(false),
  hideProbes: boolQuery(true),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})
