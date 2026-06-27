import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import {
  fetchSitePageAllLocales,
  isSiteDraftDirty,
  saveSitePageAllDirtyLocales,
  setSiteFieldSearch,
  setSiteLocalePublished,
  SITE_LOCALES,
  siteStore,
  updateLocaleDraftContent,
  type SiteLocale,
} from '@/features/site'
import { guidesStore } from './guides.store'
import type { GuideDetail, GuideListItem } from '@/types/guides'

function errMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function guidePageKey(slug: string) {
  return `guide-${slug}`
}

async function loadGuidesList() {
  guidesStore.isLoading = true
  guidesStore.error = null
  try {
    guidesStore.items = await adminApi<GuideListItem[]>('/admin/guides')
  } catch (e) {
    guidesStore.error = errMessage(e)
    guidesStore.items = []
  } finally {
    guidesStore.isLoading = false
  }
}

export function fetchGuidesList() {
  return dedupeAsync('admin:guides:list', loadGuidesList)
}

export async function fetchGuideDetail(slug: string) {
  guidesStore.isLoading = true
  guidesStore.error = null
  try {
    const detail = await adminApi<GuideDetail>(`/admin/guides/${encodeURIComponent(slug)}`)
    guidesStore.current = detail
    await fetchSitePageAllLocales(guidePageKey(slug))
    return detail
  } catch (e) {
    guidesStore.error = errMessage(e)
    guidesStore.current = null
    throw e
  } finally {
    guidesStore.isLoading = false
  }
}

export async function updateGuideMeta(
  slug: string,
  patch: Partial<{
    category: string
    readingMeta: string
    sortOrder: number
    indexed: boolean
    featured: boolean
    published: boolean
  }>,
  options?: { refreshDetail?: boolean },
) {
  guidesStore.isSaving = true
  guidesStore.error = null
  try {
    await adminApi(`/admin/guides/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    if (options?.refreshDetail !== false && guidesStore.current?.slug === slug) {
      await fetchGuideDetail(slug)
    }
    await fetchGuidesList()
  } catch (e) {
    guidesStore.error = errMessage(e)
    throw e
  } finally {
    guidesStore.isSaving = false
  }
}

export async function setGuidePublished(slug: string, published: boolean) {
  await updateGuideMeta(slug, { published }, { refreshDetail: guidesStore.current?.slug === slug })
}

export async function saveGuideLocalePublished(slug: string, locale: SiteLocale, published: boolean) {
  setSiteLocalePublished(locale, published)
  const draft = siteStore.localeDrafts[locale]
  guidesStore.isSaving = true
  guidesStore.error = null
  try {
    await adminApi(
      `/admin/guides/${encodeURIComponent(slug)}/content?locale=${encodeURIComponent(locale)}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          content: draft?.content ?? {},
          published,
        }),
      },
    )
    if (guidesStore.current?.slug === slug) {
      await fetchGuideDetail(slug)
    }
    await fetchGuidesList()
  } catch (e) {
    guidesStore.error = errMessage(e)
    throw e
  } finally {
    guidesStore.isSaving = false
  }
}

/** Salva bozze pendenti, pubblica la guida e il contenuto IT sul sito. */
export async function publishGuide(slug: string) {
  guidesStore.isSaving = true
  guidesStore.error = null
  try {
    if (isSiteDraftDirty()) {
      await saveSitePageAllDirtyLocales(guidePageKey(slug))
    }
    setSiteLocalePublished('IT', true)
    const draft = siteStore.localeDrafts.IT
    await adminApi(
      `/admin/guides/${encodeURIComponent(slug)}/content?locale=IT`,
      {
        method: 'PUT',
        body: JSON.stringify({
          content: draft?.content ?? {},
          published: true,
        }),
      },
    )
    await adminApi(`/admin/guides/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: JSON.stringify({ published: true, indexed: true }),
    })
    if (guidesStore.current?.slug === slug) {
      await fetchGuideDetail(slug)
    }
    await fetchGuidesList()
  } catch (e) {
    guidesStore.error = errMessage(e)
    throw e
  } finally {
    guidesStore.isSaving = false
  }
}

export async function unpublishGuide(slug: string) {
  await updateGuideMeta(slug, { published: false })
}

export async function saveGuideContent(
  slug: string,
  locale: SiteLocale,
  options?: { translateAllLocales?: boolean },
) {
  const draft = siteStore.localeDrafts[locale]
  guidesStore.isSaving = true
  guidesStore.error = null
  try {
    await adminApi(
      `/admin/guides/${encodeURIComponent(slug)}/content?locale=${encodeURIComponent(locale)}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          content: draft?.content ?? siteStore.draftContent,
          published: draft?.published ?? true,
          translateAllLocales: options?.translateAllLocales ?? false,
        }),
      },
    )
    await fetchGuideDetail(slug)
    await fetchGuidesList()
  } catch (e) {
    guidesStore.error = errMessage(e)
    throw e
  } finally {
    guidesStore.isSaving = false
  }
}

export async function saveGuideAllDirtyLocales(slug: string) {
  guidesStore.isSaving = true
  guidesStore.error = null
  try {
    await saveSitePageAllDirtyLocales(guidePageKey(slug))
    await fetchGuideDetail(slug)
    await fetchGuidesList()
  } catch (e) {
    guidesStore.error = errMessage(e)
    throw e
  } finally {
    guidesStore.isSaving = false
  }
}

export async function translateGuide(slug: string, onlyMissingLocales = false) {
  guidesStore.isTranslating = true
  guidesStore.error = null
  try {
    const draft = siteStore.localeDrafts.IT
    const result = await adminApi<{ targetLocales: string[]; skippedLocales?: string[] }>(
      `/admin/guides/${encodeURIComponent(slug)}/translate`,
      {
        method: 'POST',
        body: JSON.stringify({
          content: draft?.content,
          sourceLocale: 'IT',
          onlyMissingLocales,
        }),
      },
    )
    await fetchGuideDetail(slug)
    await fetchGuidesList()
    return result
  } catch (e) {
    guidesStore.error = errMessage(e)
    throw e
  } finally {
    guidesStore.isTranslating = false
  }
}

export function setGuideFieldSearch(query: string) {
  guidesStore.fieldSearch = query
  setSiteFieldSearch(query)
}

export {
  isSiteDraftDirty,
  setSiteLocalePublished,
  updateLocaleDraftContent,
  siteStore,
  SITE_LOCALES,
  type SiteLocale,
}

export function getGuideLabel(slug: string) {
  return guidesStore.items.find((item) => item.slug === slug)?.title ?? slug
}

export function isValidGuideSlug(slug: string) {
  return guidesStore.items.some((item) => item.slug === slug)
}
