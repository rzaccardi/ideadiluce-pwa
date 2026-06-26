/** Paesi UE (ISO2) — aggiornato post-Brexit (GB escluso). */
export const EU_COUNTRY_CODES = new Set([
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
  'IT',
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
])

export function normalizeCountryCode(code: string | null | undefined): string {
  return (code ?? 'IT').trim().toUpperCase().slice(0, 2)
}

export function isEuCountry(code: string | null | undefined): boolean {
  return EU_COUNTRY_CODES.has(normalizeCountryCode(code))
}

export function isExtraEuCountry(code: string | null | undefined): boolean {
  const c = normalizeCountryCode(code)
  return c.length === 2 && !EU_COUNTRY_CODES.has(c)
}

/** Codici speciali in `TaxRule.shippingCountry` / `billingCountry`. */
export type TaxCountryToken = '*' | 'EU' | 'EU_EXCL_IT' | 'EXTRA_EU' | string

export function matchesTaxCountry(ruleCountry: string, actual: string): boolean {
  const token = ruleCountry.trim().toUpperCase()
  const country = normalizeCountryCode(actual)
  if (token === '*' || token === '') return true
  if (token === 'EU') return isEuCountry(country)
  if (token === 'EU_EXCL_IT') return isEuCountry(country) && country !== 'IT'
  if (token === 'EXTRA_EU') return isExtraEuCountry(country)
  return token === country
}

export const DEFAULT_TAX_RATE_PCT = 22
export const DEFAULT_TAX_LABEL = 'IVA 22%'
