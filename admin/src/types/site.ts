import type { SiteLocale } from '@/features/site/site.store'

export type SiteLocaleCatalogStatus = {
  exists: boolean
  published: boolean
  updatedAt: string | null
  status: 'saved' | 'missing' | 'default'
}

export type SitePageCatalogEntry = {
  pageKey: string
  label: string
  missingLocales: readonly SiteLocale[]
  missingCount: number
  locales: Readonly<Record<SiteLocale, SiteLocaleCatalogStatus>>
}

export type SiteCatalog = {
  locales: readonly SiteLocale[]
  targetLocales: readonly SiteLocale[]
  summary: {
    totalPages: number
    missingTranslations: number
    completePages: number
    byLocale: Readonly<Record<string, number>>
  }
  pages: readonly SitePageCatalogEntry[]
}

export type SiteI18nStatus = {
  locales: readonly SiteLocale[]
  sourceLocale: 'IT'
  deepl: {
    enabled: boolean
    configured: boolean
    ready: boolean
    apiUrl: string
  }
}

export type TranslateMissingResult = {
  pageKeys: string[]
  targetLocales: string[]
  translatedCount: number
  skippedCount: number
  created: Array<{ pageKey: string; locale: string; status: 'created' }>
  skipped: Array<{ pageKey: string; locale: string; status: 'skipped' }>
}
