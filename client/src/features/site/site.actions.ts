import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import type { SitePageDTO, SitePageKey } from '@/types/site-content'
import { proxy } from 'valtio'

type SiteState = {
  pages: Partial<Record<SitePageKey, unknown>>
  pageLocales: Partial<Record<SitePageKey, string>>
  loading: Partial<Record<SitePageKey, boolean>>
  error: string | null
}

export const siteStore = proxy<SiteState>({
  pages: {},
  pageLocales: {},
  loading: {},
  error: null,
})

export function seedSitePageContent(pageKey: SitePageKey, locale: string, content: unknown) {
  if (!siteStore.pages[pageKey]) {
    siteStore.pages[pageKey] = content
    siteStore.pageLocales[pageKey] = locale
  }
}

/** Applica contenuto SSR senza attendere useEffect — evita skeleton su navigazioni con dati già noti. */
export function hydrateSitePageContent(pageKey: SitePageKey, locale: string, content: unknown) {
  siteStore.pages[pageKey] = content
  siteStore.pageLocales[pageKey] = locale
}

export function getSitePageContent(pageKey: SitePageKey): unknown {
  return siteStore.pages[pageKey] ?? null
}

export function isSitePageLoading(pageKey: SitePageKey): boolean {
  return Boolean(siteStore.loading[pageKey])
}

/** Compat helpers usati dal layout e dalle pagine principali */
export function getShellContent() {
  return siteStore.pages.shell ?? null
}

export function getHomeContent() {
  return siteStore.pages.home ?? null
}

export function getCatalogContent() {
  return siteStore.pages.catalog ?? null
}

export function fetchSitePage<K extends SitePageKey>(
  pageKey: K,
  locale: string,
  options?: { skipIfFresh?: boolean },
): Promise<SitePageDTO<K>> {
  if (
    options?.skipIfFresh &&
    siteStore.pages[pageKey] &&
    siteStore.pageLocales[pageKey] === locale
  ) {
    return Promise.resolve({ content: siteStore.pages[pageKey] } as SitePageDTO<K>)
  }

  const key = `site:${pageKey}:${locale}`
  return dedupeAsync(key, async () => {
    siteStore.loading[pageKey] = true
    siteStore.error = null
    try {
      const data = await api.site.getPage(pageKey, locale)
      siteStore.pages[pageKey] = data.content
      siteStore.pageLocales[pageKey] = locale
      return data as SitePageDTO<K>
    } catch (e) {
      siteStore.error = e instanceof Error ? e.message : 'Errore contenuti sito'
      throw e
    } finally {
      siteStore.loading[pageKey] = false
    }
  })
}

export type SiteInquiryKind = 'product-not-found' | 'contact' | 'b2b'

export function submitSiteInquiry(body: {
  kind: SiteInquiryKind
  name: string
  email: string
  phone?: string
  message?: string
  productCode?: string
  brand?: string
  quantity?: number
  locale?: string
}) {
  return api.site.submitInquiry(body)
}
