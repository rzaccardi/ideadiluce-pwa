import { describe, expect, it } from 'vitest'
import {
  EU_EXCL_IT_COUNTRIES,
  WORLDWIDE_COUNTRY_TOKEN,
  zoneMatchesCountry,
  zoneMatchesPostcode,
} from './shipping-zone-match.js'

describe('zoneMatchesCountry', () => {
  it('matcha ISO2 esatto', () => {
    expect(zoneMatchesCountry(['IT'], 'it')).toBe(true)
    expect(zoneMatchesCountry(['FR', 'DE'], 'DE')).toBe(true)
    expect(zoneMatchesCountry(['IT'], 'FR')).toBe(false)
  })

  it('matcha token worldwide *', () => {
    expect(zoneMatchesCountry([WORLDWIDE_COUNTRY_TOKEN], 'US')).toBe(true)
    expect(zoneMatchesCountry([WORLDWIDE_COUNTRY_TOKEN], 'JP')).toBe(true)
    expect(zoneMatchesCountry([WORLDWIDE_COUNTRY_TOKEN], 'IT')).toBe(true)
  })

  it('lista UE excl IT non include Italia', () => {
    expect(EU_EXCL_IT_COUNTRIES).not.toContain('IT')
    expect(EU_EXCL_IT_COUNTRIES).toContain('FR')
    expect(EU_EXCL_IT_COUNTRIES).toContain('DE')
  })
})

describe('zoneMatchesPostcode', () => {
  it('vuoto = qualsiasi CAP', () => {
    expect(zoneMatchesPostcode([], '00185')).toBe(true)
  })

  it('prefisso CAP', () => {
    expect(zoneMatchesPostcode(['001'], '00185')).toBe(true)
    expect(zoneMatchesPostcode(['001'], '20121')).toBe(false)
  })
})
