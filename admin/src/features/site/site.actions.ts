import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import { cloneContent } from './site-content-utils'
import {
  siteStore,
  type SiteLocale,
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
    return detail
  } catch (e) {
    siteStore.error = errMessage(e)
    siteStore.current = null
    throw e
  } finally {
    siteStore.isLoading = false
  }
}

function parseDraftContent() {
  if (siteStore.showAdvancedJson) {
    try {
      return JSON.parse(siteStore.draftJson) as unknown
    } catch {
      throw new Error('JSON non valido — correggi la sintassi prima di salvare.')
    }
  }
  return siteStore.draftContent
}

export async function saveSitePage(
  pageKey: string,
  locale: SiteLocale,
  published = true,
  options?: { translateAllLocales?: boolean },
) {
  const content = parseDraftContent()

  siteStore.isSaving = true
  siteStore.error = null
  try {
    await adminApi(`/admin/site/pages/${encodeURIComponent(pageKey)}?locale=${encodeURIComponent(locale)}`, {
      method: 'PUT',
      body: JSON.stringify({
        content,
        published,
        translateAllLocales: options?.translateAllLocales ?? false,
      }),
    })
    await fetchSitePage(pageKey, locale)
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
  const content = useDraft ? parseDraftContent() : undefined

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
    if (siteStore.locale !== 'IT') {
      await fetchSitePage(pageKey, siteStore.locale)
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
    if (siteStore.locale !== 'IT') {
      await fetchSitePage(siteStore.pageKey, siteStore.locale)
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
  return siteStore.draftJson !== siteStore.savedDraftJson
}

export function updateDraftContent(next: Record<string, unknown>) {
  const cloned = cloneContent(next)
  siteStore.draftContent = cloned
  siteStore.draftJson = JSON.stringify(cloned, null, 2)
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
