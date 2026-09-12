/** Token speciale: zona «resto del mondo» (qualsiasi paese non coperto da zone più specifiche). */
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

export function zoneMatchesCountry(
  zoneCountries: ReadonlyArray<string>,
  country: string,
): boolean {
  const code = country.trim().toUpperCase().slice(0, 2)
  if (!code) return false
  const normalized = zoneCountries.map((c) => c.trim().toUpperCase())
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
