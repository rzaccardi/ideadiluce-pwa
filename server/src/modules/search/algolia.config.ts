import { z } from 'zod'

const boolish = z.preprocess((value) => {
  if (value === true) return true
  if (value === false || value === undefined || value === null || value === '') return false
  const normalized = String(value).toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}, z.boolean())

const algoliaEnvSchema = z.object({
  ALGOLIA_ENABLED: boolish.default(false),
  ALGOLIA_APP_ID: z.string().optional(),
  ALGOLIA_ADMIN_KEY: z.string().optional(),
  ALGOLIA_SEARCH_KEY: z.string().optional(),
  ALGOLIA_PRODUCTS_INDEX: z.string().default('products'),
})

export type AlgoliaServerConfig = {
  enabled: boolean
  configured: boolean
  appId: string | null
  productsIndex: string
}

export function getAlgoliaServerConfig(env: NodeJS.ProcessEnv = process.env): AlgoliaServerConfig {
  const parsed = algoliaEnvSchema.parse(env)
  const appId = parsed.ALGOLIA_APP_ID?.trim() || null
  const hasKeys = Boolean(appId && parsed.ALGOLIA_ADMIN_KEY?.trim() && parsed.ALGOLIA_SEARCH_KEY?.trim())

  return {
    enabled: parsed.ALGOLIA_ENABLED && hasKeys,
    configured: hasKeys,
    appId,
    productsIndex: parsed.ALGOLIA_PRODUCTS_INDEX,
  }
}
