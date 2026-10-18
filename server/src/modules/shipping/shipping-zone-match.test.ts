import { describe, expect, it } from 'vitest'
import {
  EU_EXCL_IT_COUNTRIES,
  WORLDWIDE_COUNTRY_TOKEN,
  findMatchingShippingZone,
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

describe('findMatchingShippingZone', () => {
  const zones = [
    { id: 'it', countries: ['IT'], postcodes: [], priority: 10 },
    { id: 'eu', countries: [...EU_EXCL_IT_COUNTRIES], postcodes: [], priority: 5 },
    { id: 'world', countries: [WORLDWIDE_COUNTRY_TOKEN], postcodes: [], priority: 1 },
  ]

  it('preferisce Italia a Extra-UE per indirizzo IT', () => {
    expect(findMatchingShippingZone(zones, 'IT', '00185')?.id).toBe('it')
  })

  it('preferisce UE a Extra-UE per indirizzo FR', () => {
    expect(findMatchingShippingZone(zones, 'FR', '75001')?.id).toBe('eu')
  })

  it('usa Extra-UE solo fuori IT/UE', () => {
    expect(findMatchingShippingZone(zones, 'US', '10001')?.id).toBe('world')
    expect(findMatchingShippingZone(zones, 'JP', '100-0001')?.id).toBe('world')
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
