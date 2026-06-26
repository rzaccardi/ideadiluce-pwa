import { proxy } from 'valtio'

export const SITE_LOCALES = ['IT', 'EN', 'ES', 'FR', 'DE'] as const
export type SiteLocale = (typeof SITE_LOCALES)[number]

export type SitePageSummary = {
  id: string
  pageKey: string
  locale: string
  published: boolean
  updatedAt: string
}

export type SitePageDetail = {
  pageKey: string
  locale: string
  published: boolean
  content: unknown
  updatedAt: string | null
}

export const SITE_PAGE_OPTIONS = [
  { key: 'shell', label: 'Shell (header, footer, trust bar)' },
  { key: 'home', label: 'Homepage' },
  { key: 'catalog', label: 'Catalogo (banner design/tecnico)' },
  { key: 'attacco', label: 'Landing attacchi' },
  { key: 'ambienti', label: 'Landing ambienti' },
  { key: 'brand', label: 'Landing brand' },
  { key: 'guide', label: 'Landing guide' },
  { key: 'chi-siamo', label: 'Chi siamo' },
  { key: 'showroom', label: 'Showroom' },
  { key: 'professionisti', label: 'Professionisti B2B' },
  { key: 'lavora-con-noi', label: 'Lavora con noi' },
  { key: 'spedizioni', label: 'Spedizioni e resi' },
  { key: 'pagamenti', label: 'Pagamenti' },
  { key: 'garanzia', label: 'Garanzia' },
  { key: 'contatti', label: 'Contatti' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'cookie', label: 'Cookie' },
  { key: 'prodotto-non-trovato', label: 'Prodotto non trovato' },
  { key: 'guide-luce-calda-naturale-fredda', label: 'Guida: luce calda/naturale/fredda' },
  { key: 'guide-gu10-gu53', label: 'Guida: GU10 vs GU5.3' },
  { key: 'guide-lampadina-r7s', label: 'Guida: lampadina R7s' },
  { key: 'guide-illuminare-soggiorno', label: 'Guida: illuminare soggiorno' },
  { key: 'guide-glossario', label: 'Guida: glossario' },
  { key: 'guide-scegliere-lampadina-led', label: 'Guida: scegliere LED' },
  { key: 'guide-alimentatore-striscia-led', label: 'Guida: alimentatore striscia LED' },
] as const

export const siteStore = proxy({
  pages: [] as SitePageSummary[],
  current: null as SitePageDetail | null,
  pageKey: 'shell',
  locale: 'IT' as SiteLocale,
  draftContent: {} as Record<string, unknown>,
  draftJson: '{}',
  showAdvancedJson: false,
  isLoading: false,
  isSaving: false,
  isTranslating: false,
  error: null as string | null,
})
