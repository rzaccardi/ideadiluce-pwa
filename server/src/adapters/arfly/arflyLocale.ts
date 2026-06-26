import { HREFLANG_CODE, HUB_LOCALES, type HubLocale } from '../../lib/hub-locale.js'

/** Codici lingua Odoo/Arfly (BCP 47 con underscore). */
export const ARFLY_LANG_BY_HUB: Record<HubLocale, string> = {
  IT: 'it_IT',
  EN: 'en_US',
  FR: 'fr_FR',
  DE: 'de_DE',
  ES: 'es_ES',
}

const HUB_BY_ARFLY_LANG = new Map<string, HubLocale>(
  HUB_LOCALES.map((loc) => [ARFLY_LANG_BY_HUB[loc], loc]),
)

export function toArflyLang(locale: HubLocale): string {
  return ARFLY_LANG_BY_HUB[locale]
}

export function fromArflyLang(lang: string): HubLocale | null {
  return HUB_BY_ARFLY_LANG.get(lang) ?? null
}

export function hreflangFromArflyLang(lang: string): string {
  const hub = fromArflyLang(lang)
  return hub ? HREFLANG_CODE[hub] : lang.split('_')[0]?.toLowerCase() ?? 'it'
}
