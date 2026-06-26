import { z } from 'zod'

export const searchQuerySchema = z.object({
  q: z.string().trim().min(3).max(200),
  country: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase())
    .optional(),
  sessionToken: z.string().trim().min(8).max(128).optional(),
})

export const resolveQuerySchema = z.object({
  id: z.string().trim().min(1).max(500),
  provider: z.enum(['google', 'mapbox']),
  sessionToken: z.string().trim().min(8).max(128).optional(),
})

export type SearchQuery = z.infer<typeof searchQuerySchema>
export type ResolveQuery = z.infer<typeof resolveQuerySchema>
