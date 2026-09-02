export type NotFoundReferrerKind = 'none' | 'internal' | 'legacy' | 'external'
export type NotFoundPathKind =
  | 'product'
  | 'category'
  | 'brand'
  | 'guide'
  | 'room'
  | 'content'
  | 'probe'
  | 'other'

export type NotFoundStats = {
  days: number
  totalHits: number
  uniquePaths: number
  withReferrerHits: number
  internalHits: number
  legacyHits: number
  botHits: number
  probeHits: number
  maxDaily: number
  topPaths: Array<{ path: string; pathKind: string; hits: number; lastSeenAt: string }>
  byPathKind: Array<{ pathKind: string; count: number }>
  byReferrerKind: Array<{ referrerKind: string; count: number }>
  topReferrerHosts: Array<{ host: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
}

export type NotFoundPathRow = {
  path: string
  pathKind: string
  hits: number
  firstSeenAt: string
  lastSeenAt: string
  withReferrerHits: number
  internalHits: number
  topReferrers: Array<{ referrer: string | null; referrerKind: string; count: number }>
  redirect: { fromPath: string; toPath: string; statusCode: number } | null
}

export type NotFoundPathList = {
  items: NotFoundPathRow[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type NotFoundHit = {
  id: string
  path: string
  queryString: string | null
  referrer: string | null
  referrerHost: string | null
  referrerKind: string
  locale: string
  isBot: boolean
  isProbe: boolean
  pathKind: string
  createdAt: string
}

export type NotFoundPathDetail = {
  path: string
  pathKind: string
  hits: number
  redirect: { fromPath: string; toPath: string; statusCode: number; reason: string | null } | null
  referrers: Array<{
    referrer: string | null
    referrerHost: string | null
    referrerKind: string
    count: number
  }>
  items: NotFoundHit[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export const NOT_FOUND_PATH_KIND_LABELS: Record<string, string> = {
  product: 'Prodotto',
  category: 'Categoria',
  brand: 'Brand',
  guide: 'Guida',
  room: 'Ambiente',
  content: 'Pagina',
  probe: 'Probe / scan',
  other: 'Altro',
}

export const NOT_FOUND_REFERRER_KIND_LABELS: Record<string, string> = {
  none: 'Senza referrer',
  internal: 'Link interno',
  legacy: 'Sito precedente',
  external: 'Sito esterno',
}

export const NOT_FOUND_PATH_KIND_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Tutti i tipi' },
  { value: 'product', label: 'Prodotto' },
  { value: 'category', label: 'Categoria' },
  { value: 'brand', label: 'Brand' },
  { value: 'guide', label: 'Guida' },
  { value: 'room', label: 'Ambiente' },
  { value: 'content', label: 'Pagina' },
  { value: 'other', label: 'Altro' },
  { value: 'probe', label: 'Probe / scan' },
]

export const NOT_FOUND_REFERRER_KIND_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Tutti i referrer' },
  { value: 'internal', label: 'Link interno' },
  { value: 'legacy', label: 'Sito precedente' },
  { value: 'external', label: 'Sito esterno' },
  { value: 'none', label: 'Senza referrer' },
]
