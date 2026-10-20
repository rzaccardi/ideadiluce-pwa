import { describe, expect, it } from 'vitest'
import { parseRetryAfterMs } from './odooCatalogClient.js'

describe('parseRetryAfterMs', () => {
  it('interpreta secondi interi', () => {
    expect(parseRetryAfterMs('12')).toBe(12_000)
  })

  it('restituisce null su header assente/invalido', () => {
    expect(parseRetryAfterMs(null)).toBeNull()
    expect(parseRetryAfterMs('')).toBeNull()
    expect(parseRetryAfterMs('not-a-date')).toBeNull()
  })

  it('cap a 120s', () => {
    expect(parseRetryAfterMs('999')).toBe(120_000)
  })
})
