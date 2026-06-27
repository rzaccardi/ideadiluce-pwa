import { proxy } from 'valtio'
import type { SiteCatalog, SiteI18nStatus } from '@/types/site'

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
  hasCustomContent?: boolean
}

export type SiteLocaleDraft = {
  content: Record<string, unknown>
  draftJson: string
  savedDraftJson: string
  published: boolean
  updatedAt: string | null
  hasCustomContent?: boolean
}

function emptyLocaleDraft(): SiteLocaleDraft {
  return {
    content: {},
    draftJson: '{}',
    savedDraftJson: '{}',
    published: true,
    updatedAt: null,
  }
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
] as const

export const siteStore = proxy({
  pages: [] as SitePageSummary[],
  catalog: null as SiteCatalog | null,
  i18nStatus: null as SiteI18nStatus | null,
  current: null as SitePageDetail | null,
  pageKey: 'shell',
  locale: 'IT' as SiteLocale,
  localeDrafts: {
    IT: emptyLocaleDraft(),
    EN: emptyLocaleDraft(),
    ES: emptyLocaleDraft(),
    FR: emptyLocaleDraft(),
    DE: emptyLocaleDraft(),
  } as Record<SiteLocale, SiteLocaleDraft>,
  draftContent: {} as Record<string, unknown>,
  draftJson: '{}',
  savedDraftJson: '{}',
  fieldSearch: '',
  showAdvancedJson: false,
  isLoading: false,
  isSaving: false,
  isTranslating: false,
  isBulkTranslating: false,
  error: null as string | null,
})

export function getSitePageLabel(pageKey: string) {
  return SITE_PAGE_OPTIONS.find((page) => page.key === pageKey)?.label ?? pageKey
}

export function isValidSitePageKey(pageKey: string) {
  return SITE_PAGE_OPTIONS.some((page) => page.key === pageKey)
}
