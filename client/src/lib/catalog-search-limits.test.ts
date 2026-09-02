import { describe, expect, it } from 'vitest'
import {
  CATALOG_SEARCH_LIMITS,
  HOME_SEARCH_HINTS_DISPLAY_LIMIT,
  canFetchProductSuggestions,
  catalogSearchRetryDelayMs,
  createCatalogSearchApiGateState,
  limitHomeSearchHints,
  recordProductSuggestionFetch,
  sanitizeCatalogSearchInput,
  sanitizeCatalogSearchInputLive,
} from './catalog-search-limits'

describe('limitHomeSearchHints', () => {
  it('tiene i primi 5 chip per una sola riga in Home', () => {
    const hints = [
      'PATR05902',
      'SPL-493610884',
      'GENE64087',
      'SPL-491810884',
      'SPL-492830140',
      'SPL-498030140',
      'OSRA464749',
      'OSRA591469',
    ]
    expect(limitHomeSearchHints(hints)).toEqual(hints.slice(0, HOME_SEARCH_HINTS_DISPLAY_LIMIT))
    expect(limitHomeSearchHints(hints)).toHaveLength(5)
  })
})

describe('sanitizeCatalogSearchInput', () => {
  it('tronca query troppo lunghe', () => {
    const long = 'a'.repeat(200)
    expect(sanitizeCatalogSearchInput(long)).toHaveLength(CATALOG_SEARCH_LIMITS.maxQueryLength)
  })

  it('rimuove caratteri di controllo e collassa spazi', () => {
    expect(sanitizeCatalogSearchInput('  GU10\u0007   12V  ')).toBe('GU10 12V')
  })
})

describe('sanitizeCatalogSearchInputLive', () => {
  it('mantiene lo spazio finale mentre si digita la parola successiva', () => {
    expect(sanitizeCatalogSearchInputLive('lampada ')).toBe('lampada ')
  })
})

describe('canFetchProductSuggestions', () => {
  it('blocca query troppo corte per API', () => {
    const state = createCatalogSearchApiGateState()
    expect(canFetchProductSuggestions('GU', state, 0)).toEqual({
      allowed: false,
      reason: 'too_short',
    })
  })

  it('blocca richieste duplicate ravvicinate', () => {
    let state = createCatalogSearchApiGateState()
    state = recordProductSuggestionFetch(state, 'GU10', 1000)
    expect(canFetchProductSuggestions('GU10', state, 5000)).toEqual({
      allowed: false,
      reason: 'duplicate',
    })
  })

  it('blocca richieste troppo frequenti', () => {
    let state = createCatalogSearchApiGateState()
    state = recordProductSuggestionFetch(state, 'E27', 1000)
    expect(canFetchProductSuggestions('E14', state, 1500)).toEqual({
      allowed: false,
      reason: 'interval',
    })
  })

  it('blocca dopo il limite per minuto', () => {
    const now = 60_000
    const state = {
      lastApiQuery: 'precedente',
      lastApiAtMs: now - 5000,
      apiTimestamps: Array.from(
        { length: CATALOG_SEARCH_LIMITS.maxApiPerMinute },
        (_, i) => now - 30_000 + i * 1000,
      ),
    }
    expect(canFetchProductSuggestions('altro', state, now)).toEqual({
      allowed: false,
      reason: 'rate_limit',
    })
  })

  it('consente richiesta dopo intervallo e query diversa', () => {
    let state = createCatalogSearchApiGateState()
    state = recordProductSuggestionFetch(state, 'GU10', 1000)
    expect(canFetchProductSuggestions('E27', state, 1000 + CATALOG_SEARCH_LIMITS.minApiIntervalMs)).toEqual({
      allowed: true,
    })
  })
})

describe('catalogSearchRetryDelayMs', () => {
  it('attende il resto dell intervallo minimo tra chiamate', () => {
    const state = recordProductSuggestionFetch(createCatalogSearchApiGateState(), 'Lampada da tavo', 1000)
    expect(catalogSearchRetryDelayMs('interval', state, 1300)).toBe(700)
  })

  it('non ritenta per duplicate o too_short', () => {
    const state = createCatalogSearchApiGateState()
    expect(catalogSearchRetryDelayMs('duplicate', state, 1000)).toBeNull()
    expect(catalogSearchRetryDelayMs('too_short', state, 1000)).toBeNull()
  })
})
