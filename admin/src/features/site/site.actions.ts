import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import { cloneContent } from './site-content-utils'
import {
  siteStore,
  type SiteLocale,
  type SiteLocaleDraft,
  type SitePageDetail,
  type SitePageSummary,
} from './site.store'
import type { SiteCatalog, SiteI18nStatus, TranslateMissingResult } from '@/types/site'

function errMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function setDraftContent(content: unknown) {
  const record =
    content && typeof content === 'object' && !Array.isArray(content)
      ? (content as Record<string, unknown>)
      : {}
  const cloned = cloneContent(record)
  const json = JSON.stringify(cloned, null, 2)
  siteStore.draftContent = cloned
  siteStore.draftJson = json
  siteStore.savedDraftJson = json
}

function setLocaleDraft(locale: SiteLocale, detail: SitePageDetail) {
  const record =
    detail.content && typeof detail.content === 'object' && !Array.isArray(detail.content)
      ? (detail.content as Record<string, unknown>)
      : {}
  const cloned = cloneContent(record)
  const json = JSON.stringify(cloned, null, 2)
  const draft: SiteLocaleDraft = {
    content: cloned,
    draftJson: json,
    savedDraftJson: json,
    published: detail.published,
    updatedAt: detail.updatedAt,
    hasCustomContent: detail.hasCustomContent,
  }
  siteStore.localeDrafts[locale] = draft
  if (locale === siteStore.locale) {
    siteStore.current = detail
    siteStore.draftContent = cloned
    siteStore.draftJson = json
    siteStore.savedDraftJson = json
  }
}

async function loadSitePagesList() {
  siteStore.isLoading = true
  siteStore.error = null
  try {
    siteStore.pages = await adminApi<SitePageSummary[]>('/admin/site/pages')
  } catch (e) {
    siteStore.error = errMessage(e)
    siteStore.pages = []
  } finally {
    siteStore.isLoading = false
  }
}

export function fetchSitePagesList() {
  return dedupeAsync('admin:site:pages', loadSitePagesList)
}

async function loadSiteCatalog() {
  try {
    siteStore.catalog = await adminApi<SiteCatalog>('/admin/site/catalog')
  } catch (e) {
    siteStore.error = errMessage(e)
    siteStore.catalog = null
  }
}

export function fetchSiteCatalog() {
  return dedupeAsync('admin:site:catalog', loadSiteCatalog)
}

async function loadSiteI18nStatus() {
  try {
    siteStore.i18nStatus = await adminApi<SiteI18nStatus>('/admin/site/i18n/status')
  } catch {
    siteStore.i18nStatus = null
  }
}

export function fetchSiteI18nStatus() {
  return dedupeAsync('admin:site:i18n-status', loadSiteI18nStatus)
}

export async function refreshSiteTranslationOverview() {
  await Promise.all([fetchSiteCatalog(), fetchSiteI18nStatus()])
}

export async function fetchSitePage(pageKey: string, locale: SiteLocale) {
  siteStore.isLoading = true
  siteStore.error = null
  siteStore.pageKey = pageKey
  siteStore.locale = locale
  try {
    const detail = await adminApi<SitePageDetail>(
      `/admin/site/pages/${encodeURIComponent(pageKey)}?locale=${encodeURIComponent(locale)}`,
    )
    siteStore.current = detail
    setDraftContent(detail.content)
    setLocaleDraft(locale, detail)
    return detail
  } catch (e) {
    siteStore.error = errMessage(e)
    siteStore.current = null
    throw e
  } finally {
    siteStore.isLoading = false
  }
}

export async function fetchSitePageAllLocales(pageKey: string) {
  siteStore.isLoading = true
  siteStore.error = null
  siteStore.pageKey = pageKey
  siteStore.locale = 'IT'
  try {
    const batch = await adminApi<{ pageKey: string; locales: SitePageDetail[] }>(
      `/admin/site/pages/${encodeURIComponent(pageKey)}?allLocales=1`,
    )
    for (const detail of batch.locales) {
      setLocaleDraft(detail.locale as SiteLocale, detail)
    }
    const italian = batch.locales.find((entry) => entry.locale === 'IT')
    if (italian) {
      siteStore.current = italian
    }
    return batch.locales
  } catch (e) {
    siteStore.error = errMessage(e)
    siteStore.current = null
    throw e
  } finally {
    siteStore.isLoading = false
  }
}

function parseDraftContent(locale: SiteLocale = siteStore.locale) {
  const draft = siteStore.localeDrafts[locale]
  if (siteStore.showAdvancedJson && locale === siteStore.locale) {
    try {
      return JSON.parse(siteStore.draftJson) as unknown
    } catch {
      throw new Error('JSON non valido — correggi la sintassi prima di salvare.')
    }
  }
  return draft?.content ?? siteStore.draftContent
}

export async function saveSitePage(
  pageKey: string,
  locale: SiteLocale,
  published = true,
  options?: { translateAllLocales?: boolean },
) {
  const content = parseDraftContent(locale)
  const draft = siteStore.localeDrafts[locale]
  const publishedValue = draft?.published ?? published

  siteStore.isSaving = true
  siteStore.error = null
  try {
    await adminApi(`/admin/site/pages/${encodeURIComponent(pageKey)}?locale=${encodeURIComponent(locale)}`, {
      method: 'PUT',
      body: JSON.stringify({
        content,
        published: publishedValue,
        translateAllLocales: options?.translateAllLocales ?? false,
      }),
    })
    if (options?.translateAllLocales && locale === 'IT') {
      await fetchSitePageAllLocales(pageKey)
    } else {
      await fetchSitePage(pageKey, locale)
    }
    await fetchSitePagesList()
    await refreshSiteTranslationOverview()
  } catch (e) {
    siteStore.error = errMessage(e)
    throw e
  } finally {
    siteStore.isSaving = false
  }
}

export async function saveSitePageAllDirtyLocales(pageKey: string) {
  const dirtyLocales = (['IT', 'EN', 'ES', 'FR', 'DE'] as SiteLocale[]).filter((locale) =>
    isSiteLocaleDraftDirty(locale),
  )
  if (dirtyLocales.length === 0) return

  siteStore.isSaving = true
  siteStore.error = null
  try {
    for (const locale of dirtyLocales) {
      const content = parseDraftContent(locale)
      const draft = siteStore.localeDrafts[locale]
      await adminApi(`/admin/site/pages/${encodeURIComponent(pageKey)}?locale=${encodeURIComponent(locale)}`, {
        method: 'PUT',
        body: JSON.stringify({
          content,
          published: draft?.published ?? true,
          translateAllLocales: false,
        }),
      })
    }
    await fetchSitePageAllLocales(pageKey)
    await fetchSitePagesList()
    await refreshSiteTranslationOverview()
  } catch (e) {
    siteStore.error = errMessage(e)
    throw e
  } finally {
    siteStore.isSaving = false
  }
}

export async function translateSitePage(
  pageKey: string,
  options?: { onlyMissingLocales?: boolean; useDraft?: boolean },
) {
  const onlyMissingLocales = options?.onlyMissingLocales ?? false
  const useDraft = options?.useDraft ?? !onlyMissingLocales
  const content = useDraft ? parseDraftContent('IT') : undefined

  siteStore.isTranslating = true
  siteStore.error = null
  try {
    const result = await adminApi<{
      targetLocales: string[]
      skippedLocales?: string[]
      locales: Array<{ locale: string; updatedAt: string; skipped?: boolean }>
    }>(`/admin/site/pages/${encodeURIComponent(pageKey)}/translate`, {
      method: 'POST',
      body: JSON.stringify({ content, sourceLocale: 'IT', onlyMissingLocales }),
    })
    await fetchSitePagesList()
    await refreshSiteTranslationOverview()
    if (siteStore.pageKey === pageKey) {
      await fetchSitePageAllLocales(pageKey)
    }
    return result
  } catch (e) {
    siteStore.error = errMessage(e)
    throw e
  } finally {
    siteStore.isTranslating = false
  }
}

export async function translateAllMissingSitePages(pageKeys?: string[]) {
  siteStore.isBulkTranslating = true
  siteStore.error = null
  try {
    const result = await adminApi<TranslateMissingResult>('/admin/site/i18n/translate-missing', {
      method: 'POST',
      body: JSON.stringify(pageKeys?.length ? { pageKeys } : {}),
    })
    await fetchSitePagesList()
    await refreshSiteTranslationOverview()
    if (siteStore.pageKey) {
      await fetchSitePageAllLocales(siteStore.pageKey)
    }
    return result
  } catch (e) {
    siteStore.error = errMessage(e)
    throw e
  } finally {
    siteStore.isBulkTranslating = false
  }
}

export function setSiteFieldSearch(query: string) {
  siteStore.fieldSearch = query
}

export function isSiteDraftDirty() {
  return (['IT', 'EN', 'ES', 'FR', 'DE'] as SiteLocale[]).some((locale) => isSiteLocaleDraftDirty(locale))
}

export function isSiteLocaleDraftDirty(locale: SiteLocale) {
  const draft = siteStore.localeDrafts[locale]
  return draft ? draft.draftJson !== draft.savedDraftJson : false
}

export function updateLocaleDraftContent(locale: SiteLocale, next: Record<string, unknown>) {
  const cloned = cloneContent(next)
  const json = JSON.stringify(cloned, null, 2)
  const draft = siteStore.localeDrafts[locale]
  if (draft) {
    draft.content = cloned
    draft.draftJson = json
  }
  if (locale === 'IT') {
    siteStore.draftContent = cloned
    siteStore.draftJson = json
  }
}

export function setSiteLocalePublished(locale: SiteLocale, published: boolean) {
  const draft = siteStore.localeDrafts[locale]
  if (draft) draft.published = published
}

export function updateDraftContent(next: Record<string, unknown>) {
  updateLocaleDraftContent('IT', next)
}

export function updateDraftJson(json: string) {
  siteStore.draftJson = json
  try {
    const parsed = JSON.parse(json) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      siteStore.draftContent = parsed as Record<string, unknown>
    }
  } catch {
    // JSON incompleto in modalità avanzata — non sincronizzare finché non è valido
  }
}
