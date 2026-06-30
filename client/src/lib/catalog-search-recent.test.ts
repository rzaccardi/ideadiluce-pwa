import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearRecentSearchQueries,
  CATALOG_SEARCH_RECENT_MAX,
  getRecentSearchQueries,
  recentQueriesToSuggestionGroup,
  recordRecentSearchQuery,
} from './catalog-search-recent'
import { legacyCatalogSearchRecentKey } from './storage-keys'

const storage = new Map<string, string>()

beforeEach(() => {
  storage.clear()
  const localStorageMock = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
  }
  vi.stubGlobal('localStorage', localStorageMock)
  vi.stubGlobal('window', { localStorage: localStorageMock })
})

describe('catalog-search-recent', () => {
  it('salva e recupera query per locale', () => {
    recordRecentSearchQuery('IT', 'GU10')
    recordRecentSearchQuery('IT', 'E27')

    expect(getRecentSearchQueries('IT')).toEqual(['E27', 'GU10'])
    expect(getRecentSearchQueries('EN')).toEqual([])
  })

  it('sposta in cima le query duplicate', () => {
    recordRecentSearchQuery('IT', 'GU10')
    recordRecentSearchQuery('IT', 'E27')
    recordRecentSearchQuery('IT', 'GU10')

    expect(getRecentSearchQueries('IT')).toEqual(['GU10', 'E27'])
  })

  it('rispetta il limite massimo', () => {
    for (let index = 0; index < CATALOG_SEARCH_RECENT_MAX + 3; index += 1) {
      recordRecentSearchQuery('IT', `query-${index}`)
    }
    expect(getRecentSearchQueries('IT')).toHaveLength(CATALOG_SEARCH_RECENT_MAX)
  })

  it('converte le query recenti in gruppo suggerimenti', () => {
    const group = recentQueriesToSuggestionGroup(['GU10', 'E27'])
    expect(group?.kind).toBe('query')
    expect(group?.items).toHaveLength(2)
    expect(group?.items[0]?.path).toBe('/negozio?q=GU10')
  })

  it('pulisce lo storage', () => {
    recordRecentSearchQuery('IT', 'GU10')
    clearRecentSearchQueries('IT')
    expect(getRecentSearchQueries('IT')).toEqual([])
  })

  it('riordina una query recente selezionata', () => {
    recordRecentSearchQuery('IT', 'GU10')
    recordRecentSearchQuery('IT', 'E27')
    recordRecentSearchQuery('IT', 'GU10')
    expect(getRecentSearchQueries('IT')[0]).toBe('GU10')
  })

  it('migra le query dalla chiave legacy idl:', () => {
    storage.set(
      legacyCatalogSearchRecentKey('IT'),
      JSON.stringify([{ query: 'GU10', at: 1 }]),
    )

    expect(getRecentSearchQueries('IT')).toEqual(['GU10'])
    expect(storage.has(legacyCatalogSearchRecentKey('IT'))).toBe(false)
  })
})
