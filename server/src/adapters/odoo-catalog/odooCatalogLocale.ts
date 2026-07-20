import { HREFLANG_CODE, HUB_LOCALES, type HubLocale } from '../../lib/hub-locale.js'

/** Lingue ammesse dal contratto Odoo API v2 (fallback silenzioso su it_IT lato Odoo). */
export const ODOO_CATALOG_SUPPORTED_LANGS = [
  'it_IT',
  'en_US',
  'fr_FR',
  'de_DE',
  'es_ES',
  'ro_RO',
] as const

export type OdooCatalogLang = (typeof ODOO_CATALOG_SUPPORTED_LANGS)[number]

/** Codici lingua Odoo (BCP 47 con underscore). */
export const ODOO_CATALOG_LANG_BY_HUB: Record<HubLocale, OdooCatalogLang> = {
  IT: 'it_IT',
  EN: 'en_US',
  FR: 'fr_FR',
  DE: 'de_DE',
  ES: 'es_ES',
}

/** `ro_RO` è nel contratto API; la PWA non espone ancora rotte RO → mappa a IT. */
const HUB_BY_ODOO_CATALOG_LANG = new Map<string, HubLocale>([
  ...HUB_LOCALES.map((loc) => [ODOO_CATALOG_LANG_BY_HUB[loc], loc] as const),
  ['ro_RO', 'IT'],
])

export function toOdooCatalogLang(locale: HubLocale): OdooCatalogLang {
  return ODOO_CATALOG_LANG_BY_HUB[locale]
}

export function fromOdooCatalogLang(lang: string): HubLocale | null {
  return HUB_BY_ODOO_CATALOG_LANG.get(lang) ?? null
}

/** Normalizza un lang query verso un codice contratto; valori non ammessi → it_IT. */
export function normalizeOdooCatalogLang(lang: string | undefined | null): OdooCatalogLang {
  if (!lang?.trim()) return 'it_IT'
  const normalized = lang.trim()
  if ((ODOO_CATALOG_SUPPORTED_LANGS as readonly string[]).includes(normalized)) {
    return normalized as OdooCatalogLang
  }
  const hub = fromOdooCatalogLang(normalized)
  return hub ? ODOO_CATALOG_LANG_BY_HUB[hub] : 'it_IT'
}

export function hreflangFromOdooCatalogLang(lang: string): string {
  const hub = fromOdooCatalogLang(lang)
  return hub ? HREFLANG_CODE[hub] : lang.split('_')[0]?.toLowerCase() ?? 'it'
}
