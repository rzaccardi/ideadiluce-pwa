import { CONTENT_PAGE_KEYS } from './site-content-pages.defaults.js'
import type { SitePageKey } from './site.types.js'

export const SITE_LOCALES = ['IT', 'EN', 'ES', 'FR', 'DE'] as const
export type SiteLocale = (typeof SITE_LOCALES)[number]

export const SITE_PAGE_LABELS: Record<SitePageKey, string> = {
  shell: 'Shell (header, footer, trust bar)',
  home: 'Homepage',
  catalog: 'Catalogo (banner design/tecnico)',
  attacco: 'Landing attacchi',
  ambienti: 'Landing ambienti',
  brand: 'Landing brand',
  guide: 'Landing guide',
  'chi-siamo': 'Chi siamo',
  showroom: 'Showroom',
  professionisti: 'Professionisti B2B',
  'lavora-con-noi': 'Lavora con noi',
  spedizioni: 'Spedizioni e resi',
  pagamenti: 'Pagamenti',
  garanzia: 'Garanzia',
  contatti: 'Contatti',
  privacy: 'Privacy',
  cookie: 'Cookie',
  'prodotto-non-trovato': 'Prodotto non trovato',
  'guide-luce-calda-naturale-fredda': 'Guida: luce calda/naturale/fredda',
  'guide-gu10-gu53': 'Guida: GU10 vs GU5.3',
  'guide-lampadina-r7s': 'Guida: lampadina R7s',
  'guide-illuminare-soggiorno': 'Guida: illuminare soggiorno',
  'guide-glossario': 'Guida: glossario',
  'guide-scegliere-lampadina-led': 'Guida: scegliere LED',
  'guide-alimentatore-striscia-led': 'Guida: alimentatore striscia LED',
}

export const SITE_CONTENT_PAGE_KEYS = CONTENT_PAGE_KEYS

export function normalizeSiteLocale(locale: string): SiteLocale {
  const upper = locale.toUpperCase()
  return SITE_LOCALES.includes(upper as SiteLocale) ? (upper as SiteLocale) : 'IT'
}
