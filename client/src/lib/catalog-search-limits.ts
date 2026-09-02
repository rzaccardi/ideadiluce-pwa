/** Limiti ricerca catalogo — allineare a server/catalog-search-guard.ts */

export const CATALOG_SEARCH_LIMITS = {
  minLocalLength: 2,
  minApiLength: 3,
  maxQueryLength: 120,
  debounceMs: 350,
  minApiIntervalMs: 1000,
  maxApiPerMinute: 25,
  suggestPageSize: 6,
  duplicateCacheMs: 30_000,
} as const

/** Chip "Prova:" in Home: 5 codici Odoo stanno su una riga nel container da 1000px. */
export const HOME_SEARCH_HINTS_DISPLAY_LIMIT = 5

export function limitHomeSearchHints<T>(hints: ReadonlyArray<T>): T[] {
  return hints.slice(0, HOME_SEARCH_HINTS_DISPLAY_LIMIT)
}

export type CatalogSearchApiBlockReason = 'too_short' | 'duplicate' | 'interval' | 'rate_limit'

export type CatalogSearchApiGateState = {
  lastApiQuery: string
  lastApiAtMs: number
  apiTimestamps: number[]
}

export function createCatalogSearchApiGateState(): CatalogSearchApiGateState {
  return { lastApiQuery: '', lastApiAtMs: 0, apiTimestamps: [] }
}

/** Sanitizza input mentre l'utente digita — senza trim per non bloccare gli spazi tra parole. */
export function sanitizeCatalogSearchInputLive(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, CATALOG_SEARCH_LIMITS.maxQueryLength)
}

/** Normalizza query per confronti, API e submit: rimuove control chars, collassa spazi, tronca. */
export function sanitizeCatalogSearchInput(raw: string): string {
  return sanitizeCatalogSearchInputLive(raw).trim()
}

export function canFetchProductSuggestions(
  query: string,
  state: CatalogSearchApiGateState,
  nowMs: number,
): { allowed: true } | { allowed: false; reason: CatalogSearchApiBlockReason } {
  const q = sanitizeCatalogSearchInput(query)
  if (q.length < CATALOG_SEARCH_LIMITS.minApiLength) {
    return { allowed: false, reason: 'too_short' }
  }
  if (
    q === state.lastApiQuery &&
    state.lastApiAtMs > 0 &&
    nowMs - state.lastApiAtMs < CATALOG_SEARCH_LIMITS.duplicateCacheMs
  ) {
    return { allowed: false, reason: 'duplicate' }
  }
  if (state.lastApiAtMs > 0 && nowMs - state.lastApiAtMs < CATALOG_SEARCH_LIMITS.minApiIntervalMs) {
    return { allowed: false, reason: 'interval' }
  }
  const windowStart = nowMs - 60_000
  const recentCount = state.apiTimestamps.filter((t) => t >= windowStart).length
  if (recentCount >= CATALOG_SEARCH_LIMITS.maxApiPerMinute) {
    return { allowed: false, reason: 'rate_limit' }
  }
  return { allowed: true }
}

export function recordProductSuggestionFetch(
  state: CatalogSearchApiGateState,
  query: string,
  nowMs: number,
): CatalogSearchApiGateState {
  const q = sanitizeCatalogSearchInput(query)
  const windowStart = nowMs - 60_000
  return {
    lastApiQuery: q,
    lastApiAtMs: nowMs,
    apiTimestamps: [...state.apiTimestamps.filter((t) => t >= windowStart), nowMs],
  }
}

/** Attesa prima di ritentare un suggest bloccato da interval/rate limit. */
export function catalogSearchRetryDelayMs(
  reason: CatalogSearchApiBlockReason,
  state: CatalogSearchApiGateState,
  nowMs: number,
): number | null {
  if (reason === 'interval') {
    return Math.max(0, CATALOG_SEARCH_LIMITS.minApiIntervalMs - (nowMs - state.lastApiAtMs))
  }
  if (reason === 'rate_limit') {
    const oldest = state.apiTimestamps.reduce((min, stamp) => Math.min(min, stamp), Number.POSITIVE_INFINITY)
    if (!Number.isFinite(oldest)) return CATALOG_SEARCH_LIMITS.minApiIntervalMs
    return Math.max(0, 60_000 - (nowMs - oldest))
  }
  return null
}
