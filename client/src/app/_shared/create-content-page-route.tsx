import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ContentPage } from '@/views/ContentPage'
import { getRequestLocale } from '@/lib/locale-server'
import { fetchContentPageServer } from '@/lib/server-site-cache'
import { buildContentPageMetadata } from '@/lib/seo/content-metadata'
import { isContentPage } from '@/lib/site-page-keys'
import type { ContentPageContent, SitePageKey } from '@/types/site-content'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { buildArticleJsonLd } from '@/lib/seo/json-ld'
import { getSiteUrl } from '@/lib/env'
import { localizePath } from '@/lib/locale'
import { getLegacySeoPage, type LegacySeoPageId } from '@/lib/legacy-seo-pages'

const CONTENT_PAGE_PATHS: Partial<Record<SitePageKey, string>> = {
  'chi-siamo': '/chi-siamo',
  showroom: '/showroom',
  'lavora-con-noi': '/lavora-con-noi',
  spedizioni: '/spedizioni',
  pagamenti: '/pagamenti',
  garanzia: '/garanzia',
  contatti: '/contatti',
  privacy: '/privacy-policy',
  cookie: '/cookie',
  termini: '/tos',
  'prodotto-non-trovato': '/on-demand',
}

const LEGACY_CONTENT_SEO: Partial<Record<SitePageKey, LegacySeoPageId>> = {
  privacy: 'privacy-policy',
  termini: 'tos',
  'prodotto-non-trovato': 'on-demand',
}

const CONTENT_PAGE_FALLBACKS: Partial<Record<SitePageKey, { title: string; description?: string }>> = {
  'chi-siamo': { title: 'Chi siamo' },
  showroom: { title: 'Showroom' },
  'lavora-con-noi': { title: 'Lavora con noi' },
  spedizioni: { title: 'Spedizioni' },
  pagamenti: { title: 'Pagamenti' },
  garanzia: { title: 'Garanzia e resi' },
  contatti: { title: 'Contatti' },
  cookie: { title: 'Cookie Policy', description: 'Uso dei cookie e tecnologie simili.' },
}

export function createContentPageRoute(pageKey: SitePageKey) {
  const path = CONTENT_PAGE_PATHS[pageKey]

  async function generateMetadata(): Promise<Metadata> {
    if (!path) return {}

    const legacyId = LEGACY_CONTENT_SEO[pageKey]
    if (legacyId) {
      const legacy = getLegacySeoPage(legacyId)
      return buildContentPageMetadata({
        pageKey,
        path,
        fallbackTitle: legacy.title,
        fallbackDescription: legacy.description,
      })
    }

    const fallback = CONTENT_PAGE_FALLBACKS[pageKey]
    if (!fallback) return {}

    return buildContentPageMetadata({
      pageKey,
      path,
      fallbackTitle: fallback.title,
      fallbackDescription: fallback.description,
    })
  }

  async function Page() {
    const locale = await getRequestLocale()
    const initialContent = await fetchContentPageServer<ContentPageContent>(pageKey, locale)
    if (initialContent && !isContentPage(initialContent)) {
      notFound()
    }

    const site = getSiteUrl().replace(/\/$/, '')
    const pageUrl = path ? `${site}${localizePath(path, locale)}` : site
    const articleJsonLd =
      initialContent && path
        ? buildArticleJsonLd({
            title: initialContent.title,
            description: initialContent.subtitle ?? initialContent.intro,
            url: pageUrl,
          })
        : null

    return (
      <>
        <JsonLdGraph items={[articleJsonLd]} />
        <ContentPage pageKey={pageKey} initialContent={initialContent} />
      </>
    )
  }

  return { Page, generateMetadata }
}
