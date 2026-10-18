/** Token speciale: zona «resto del mondo» (solo se nessuna zona ha il paese esatto). */
export const WORLDWIDE_COUNTRY_TOKEN = '*'

/** Paesi UE esclusa Italia (ISO2) — allineati a tax.constants EU_COUNTRY_CODES. */
export const EU_EXCL_IT_COUNTRIES: readonly string[] = [
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
]

function normalizeCountryCode(country: string): string {
  return country.trim().toUpperCase().slice(0, 2)
}

function normalizeZoneCountries(zoneCountries: ReadonlyArray<string>): string[] {
  return zoneCountries.map((c) => c.trim().toUpperCase())
}

export function zoneHasExactCountry(
  zoneCountries: ReadonlyArray<string>,
  country: string,
): boolean {
  const code = normalizeCountryCode(country)
  if (!code) return false
  return normalizeZoneCountries(zoneCountries).includes(code)
}

export function zoneHasWorldwideToken(zoneCountries: ReadonlyArray<string>): boolean {
  return normalizeZoneCountries(zoneCountries).includes(WORLDWIDE_COUNTRY_TOKEN)
}

/**
 * Match grezzo (paese esatto oppure token *).
 * Per scegliere la zona applicabile usare `findMatchingShippingZone` (priorità + * solo fallback).
 */
export function zoneMatchesCountry(
  zoneCountries: ReadonlyArray<string>,
  country: string,
): boolean {
  const code = normalizeCountryCode(country)
  if (!code) return false
  const normalized = normalizeZoneCountries(zoneCountries)
  if (normalized.includes(code)) return true
  return normalized.includes(WORLDWIDE_COUNTRY_TOKEN)
}

export function zoneMatchesPostcode(
  postcodes: ReadonlyArray<string>,
  postalCode: string,
): boolean {
  if (postcodes.length === 0) return true
  const pc = postalCode.replace(/\s/g, '')
  return postcodes.some((p) => pc.startsWith(p.replace(/\s/g, '')))
}

type ZoneMatchInput = {
  countries: ReadonlyArray<string>
  postcodes: ReadonlyArray<string>
}

/**
 * Zona applicabile: prima match esatto sul paese (priorità già ordinata desc),
 * poi eventuale zona «resto del mondo» (*). Non mescola IT/UE con Extra-UE.
 */
export function findMatchingShippingZone<T extends ZoneMatchInput>(
  zones: ReadonlyArray<T>,
  country: string,
  postalCode: string,
): T | undefined {
  const exact = zones.find(
    (zone) =>
      zoneHasExactCountry(zone.countries, country) &&
      zoneMatchesPostcode(zone.postcodes, postalCode),
  )
  if (exact) return exact
  return zones.find(
    (zone) =>
      zoneHasWorldwideToken(zone.countries) &&
      zoneMatchesPostcode(zone.postcodes, postalCode),
  )
}
