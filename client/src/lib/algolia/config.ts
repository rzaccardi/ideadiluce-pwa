const boolish = (value: string | undefined): boolean => {
  if (!value) return false
  const normalized = value.toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

export type AlgoliaClientConfig = {
  enabled: boolean
  appId: string | null
  searchKey: string | null
  productsIndex: string
}

export function getAlgoliaClientConfig(): AlgoliaClientConfig {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID?.trim() || null
  const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY?.trim() || null
  const enabled = boolish(process.env.NEXT_PUBLIC_ALGOLIA_ENABLED) && Boolean(appId && searchKey)

  return {
    enabled,
    appId,
    searchKey,
    productsIndex: process.env.NEXT_PUBLIC_ALGOLIA_PRODUCTS_INDEX?.trim() || 'products',
  }
}
