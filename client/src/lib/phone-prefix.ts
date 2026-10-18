import { CHECKOUT_COUNTRIES } from '@/components/checkout/stripe-ui/constants'

/** Prefissi telefonici internazionali (senza +) per i paesi del checkout. */
export const PHONE_DIAL_CODES: Record<string, string> = {
  IT: '39',
  AT: '43',
  BE: '32',
  BG: '359',
  HR: '385',
  CY: '357',
  CZ: '420',
  DK: '45',
  EE: '372',
  FI: '358',
  FR: '33',
  DE: '49',
  GR: '30',
  HU: '36',
  IE: '353',
  LV: '371',
  LT: '370',
  LU: '352',
  MT: '356',
  NL: '31',
  PL: '48',
  PT: '351',
  RO: '40',
  SK: '421',
  SI: '386',
  ES: '34',
  SE: '46',
  CH: '41',
  GB: '44',
  NO: '47',
  US: '1',
  CA: '1',
  AE: '971',
  AU: '61',
  JP: '81',
  SG: '65',
  HK: '852',
  IL: '972',
  ZA: '27',
  BR: '55',
  MX: '52',
}

export type PhoneCountry = {
  code: string
  label: string
  dial: string
}

const DIALS_BY_LENGTH = [...new Set(Object.values(PHONE_DIAL_CODES))].sort(
  (a, b) => b.length - a.length,
)

export const PHONE_COUNTRIES: PhoneCountry[] = CHECKOUT_COUNTRIES.flatMap((country) => {
  const dial = PHONE_DIAL_CODES[country.code]
  return dial ? [{ code: country.code, label: country.label, dial }] : []
})

const COUNTRIES_BY_DIAL = PHONE_COUNTRIES.reduce<Record<string, string[]>>((acc, country) => {
  acc[country.dial] ??= []
  acc[country.dial].push(country.code)
  return acc
}, {})

export function normalizePhoneCountry(code: string | undefined, fallback = 'IT'): string {
  const upper = code?.trim().toUpperCase() ?? ''
  if (upper && PHONE_DIAL_CODES[upper]) return upper
  return PHONE_DIAL_CODES[fallback] ? fallback : 'IT'
}

export function phoneDial(country: string): string {
  return PHONE_DIAL_CODES[normalizePhoneCountry(country)] ?? '39'
}

export type PhoneParts = {
  country: string
  dial: string
  national: string
}

/** Spezza un numero salvato in paese, prefisso e parte nazionale. */
export function splitPhone(raw: string, fallbackCountry = 'IT'): PhoneParts {
  const fallback = normalizePhoneCountry(fallbackCountry)
  const compact = raw.trim().replace(/[\s().-]/g, '')
  if (!compact) {
    return { country: fallback, dial: phoneDial(fallback), national: '' }
  }

  let international = compact
  if (international.startsWith('+')) international = international.slice(1)
  else if (international.startsWith('00')) international = international.slice(2)
  else {
    return {
      country: fallback,
      dial: phoneDial(fallback),
      national: compact.replace(/\D/g, ''),
    }
  }

  const numeric = international.replace(/\D/g, '')
  for (const dial of DIALS_BY_LENGTH) {
    if (!numeric.startsWith(dial)) continue
    const countries = COUNTRIES_BY_DIAL[dial] ?? []
    const country = countries.includes(fallback) ? fallback : (countries[0] ?? fallback)
    return { country, dial, national: numeric.slice(dial.length) }
  }

  return { country: fallback, dial: phoneDial(fallback), national: numeric }
}

/** Ricompone il numero in E.164 compatto. Vuoto se manca la parte nazionale. */
export function joinPhone(country: string, national: string): string {
  const digits = national.replace(/\D/g, '')
  if (!digits) return ''
  return `+${phoneDial(country)}${digits}`
}
