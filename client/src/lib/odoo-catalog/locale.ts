import type { PwaLocale } from '@/lib/locale'

/** Lingue ammesse dal contratto Odoo API v2. */
export const ODOO_CATALOG_SUPPORTED_LANGS = [
  'it_IT',
  'en_US',
  'fr_FR',
  'de_DE',
  'es_ES',
  'ro_RO',
] as const

export type OdooCatalogLang = (typeof ODOO_CATALOG_SUPPORTED_LANGS)[number]

export const ODOO_CATALOG_LANG_BY_PWA: Record<PwaLocale, OdooCatalogLang> = {
  IT: 'it_IT',
  EN: 'en_US',
  FR: 'fr_FR',
  DE: 'de_DE',
  ES: 'es_ES',
}

export function toOdooCatalogLang(locale: PwaLocale): OdooCatalogLang {
  return ODOO_CATALOG_LANG_BY_PWA[locale]
}

/** Valori non ammessi → it_IT (come fallback silenzioso Odoo). `ro_RO` riconosciuto ma senza rotte PWA. */
export function normalizeOdooCatalogLang(lang: string | undefined | null): OdooCatalogLang {
  if (!lang?.trim()) return 'it_IT'
  const normalized = lang.trim()
  if ((ODOO_CATALOG_SUPPORTED_LANGS as readonly string[]).includes(normalized)) {
    return normalized as OdooCatalogLang
  }
  const prefix = normalized.split('_')[0]?.toUpperCase()
  if (prefix && prefix in ODOO_CATALOG_LANG_BY_PWA) {
    return ODOO_CATALOG_LANG_BY_PWA[prefix as PwaLocale]
  }
  return 'it_IT'
}
