import { describe, expect, it } from 'vitest'
import { DEFAULT_HOME_IT } from '../site/site-content.defaults.js'
import { isSearchHintsOdooStale, parseSearchHintsOdooSyncedAt } from './search-hints-odoo.stale.js'

describe('search hints Odoo stale', () => {
  const now = Date.parse('2026-06-30T12:00:00.000Z')
  const staleMs = 72 * 3_600_000

  it('considera stale se manca il timestamp', () => {
    expect(isSearchHintsOdooStale(DEFAULT_HOME_IT, staleMs, now)).toBe(true)
    expect(parseSearchHintsOdooSyncedAt(DEFAULT_HOME_IT)).toBeNull()
  })

  it('è fresh entro 72 ore', () => {
    const content = {
      ...DEFAULT_HOME_IT,
      search: {
        ...DEFAULT_HOME_IT.search,
        hintsOdooSyncedAt: '2026-06-29T12:00:01.000Z',
      },
    }
    expect(isSearchHintsOdooStale(content, staleMs, now)).toBe(false)
  })

  it('è stale oltre 72 ore', () => {
    const content = {
      ...DEFAULT_HOME_IT,
      search: {
        ...DEFAULT_HOME_IT.search,
        hintsOdooSyncedAt: '2026-06-26T11:59:59.000Z',
      },
    }
    expect(isSearchHintsOdooStale(content, staleMs, now)).toBe(true)
  })
})
