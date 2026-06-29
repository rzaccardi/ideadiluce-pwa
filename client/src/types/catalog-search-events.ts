export type CatalogSearchSource = 'palette' | 'hero' | 'catalog' | 'brand' | 'attacco' | 'inline'

export type CatalogSearchTrackAction = 'submit' | 'suggest_pick' | 'view_all'

export type CatalogSearchEventKind =
  | 'attacco'
  | 'brand'
  | 'category'
  | 'product'
  | 'hint'
  | 'query'

export type CatalogSearchAnalyticsStats = {
  days: number
  locale: string | null
  totalEvents: number
  uniqueQueries: number
  zeroResultRate: number
  pickThroughRate: number
  maxDaily: number
  topQueries: Array<{
    normalizedQuery: string
    query: string
    count: number
    zeroResults: number
  }>
  bySource: Array<{ source: string; count: number }>
  byLocale: Array<{ locale: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
}

export type CatalogSearchAnalyticsEvent = {
  id: string
  query: string
  normalizedQuery: string
  locale: string
  source: string
  action: string
  resultCount: number | null
  productTotal: number | null
  clickedPath: string | null
  clickedKind: string | null
  clickedLabel: string | null
  userId: string | null
  sessionId: string | null
  createdAt: string
}

export type CatalogSearchAnalyticsList = {
  items: CatalogSearchAnalyticsEvent[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
