import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import {
  siteStore,
  type SiteLocale,
  type SitePageDetail,
  type SitePageSummary,
} from './site.store'

function errMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function setDraftContent(content: unknown) {
  const record =
    content && typeof content === 'object' && !Array.isArray(content)
      ? (content as Record<string, unknown>)
      : {}
  siteStore.draftContent = structuredClone(record)
  siteStore.draftJson = JSON.stringify(record, null, 2)
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
  } catch (e) {
    siteStore.error = errMessage(e)
    throw e
  } finally {
    siteStore.isSaving = false
  }
}

export async function translateSitePage(pageKey: string) {
  const content = parseDraftContent()

  siteStore.isTranslating = true
  siteStore.error = null
  try {
    const result = await adminApi<{
      targetLocales: string[]
      locales: Array<{ locale: string; updatedAt: string }>
    }>(`/admin/site/pages/${encodeURIComponent(pageKey)}/translate`, {
      method: 'POST',
      body: JSON.stringify({ content, sourceLocale: 'IT' }),
    })
    await fetchSitePagesList()
    return result
  } catch (e) {
    siteStore.error = errMessage(e)
    throw e
  } finally {
    siteStore.isTranslating = false
  }
}

export function updateDraftContent(next: Record<string, unknown>) {
  siteStore.draftContent = next
  siteStore.draftJson = JSON.stringify(next, null, 2)
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
