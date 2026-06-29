import { sanitizeCatalogSearchInput } from '@/lib/catalog-search-limits'
import type { PwaLocale } from '@/lib/locale'
import type { CatalogSearchSuggestion, CatalogSearchSuggestionGroup } from '@/lib/catalog-search-suggestions'

const STORAGE_PREFIX = 'idl:catalog-search-recent:'
export const CATALOG_SEARCH_RECENT_MAX = 8

type RecentEntry = {
  query: string
  at: number
}

function storageKey(locale: PwaLocale): string {
  return `${STORAGE_PREFIX}${locale}`
}

function readEntries(locale: PwaLocale): RecentEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(locale))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (entry): entry is RecentEntry =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as RecentEntry).query === 'string' &&
          typeof (entry as RecentEntry).at === 'number',
      )
      .slice(0, CATALOG_SEARCH_RECENT_MAX)
  } catch {
    return []
  }
}

function writeEntries(locale: PwaLocale, entries: RecentEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(locale), JSON.stringify(entries.slice(0, CATALOG_SEARCH_RECENT_MAX)))
  } catch {
    /* quota o storage disabilitato */
  }
}

export function getRecentSearchQueries(locale: PwaLocale): string[] {
  return readEntries(locale)
    .sort((a, b) => b.at - a.at)
    .map((entry) => entry.query)
}

export function recordRecentSearchQuery(locale: PwaLocale, rawQuery: string): void {
  const query = sanitizeCatalogSearchInput(rawQuery)
  if (!query) return

  const now = Date.now()
  const existing = readEntries(locale).filter((entry) => entry.query.toLowerCase() !== query.toLowerCase())
  writeEntries(locale, [{ query, at: now }, ...existing])
}

export function clearRecentSearchQueries(locale: PwaLocale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(storageKey(locale))
  } catch {
    /* ignore */
  }
}

export function recentQueriesToSuggestionGroup(
  queries: ReadonlyArray<string>,
): CatalogSearchSuggestionGroup | null {
  if (!queries.length) return null
  return {
    kind: 'query',
    items: queries.map((query) => ({
      id: `recent:${query}`,
      kind: 'query' as const,
      label: query,
      path: `/negozio?q=${encodeURIComponent(query)}`,
    })),
  }
}

export function isRecentQuerySuggestion(item: CatalogSearchSuggestion): boolean {
  return item.kind === 'query' && item.id.startsWith('recent:')
}
