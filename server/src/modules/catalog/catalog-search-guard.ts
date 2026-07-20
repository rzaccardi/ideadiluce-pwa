/** Limiti ricerca catalogo — allineare a client/lib/catalog-search-limits.ts */

export const CATALOG_SEARCH_GUARD = {
  maxQueryLength: 120,
  minQueryLength: 1,
  suggestMaxPageSize: 8,
  listMaxPageSize: 100,
  defaultPageSize: 24,
} as const

export function sanitizeCatalogSearchQuery(q: string | undefined): string | undefined {
  if (typeof q !== 'string') return undefined
  const sanitized = q
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CATALOG_SEARCH_GUARD.maxQueryLength)
  return sanitized || undefined
}

export function isCatalogSearchQueryPresent(q: string | undefined): boolean {
  return Boolean(sanitizeCatalogSearchQuery(q))
}

/** Riduce pageSize per richieste tipo suggest (q + pageSize piccolo). */
export function resolveCatalogListPageSize(
  pageSize: number | undefined,
  hasSearchQuery: boolean,
): number {
  const raw = Math.max(1, Number(pageSize) || CATALOG_SEARCH_GUARD.defaultPageSize)
  if (hasSearchQuery && raw <= 12) {
    return Math.min(CATALOG_SEARCH_GUARD.suggestMaxPageSize, raw)
  }
  return Math.min(CATALOG_SEARCH_GUARD.listMaxPageSize, raw)
}
