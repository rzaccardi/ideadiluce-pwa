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

const CONTENT_PAGE_PATHS: Partial<Record<SitePageKey, string>> = {
  'chi-siamo': '/chi-siamo',
  showroom: '/showroom',
  'lavora-con-noi': '/lavora-con-noi',
  spedizioni: '/spedizioni',
  pagamenti: '/pagamenti',
  garanzia: '/garanzia',
  contatti: '/contatti',
  privacy: '/privacy',
  cookie: '/cookie',
  'prodotto-non-trovato': '/prodotto-non-trovato',
}

const CONTENT_PAGE_FALLBACKS: Partial<Record<SitePageKey, { title: string; description?: string }>> = {
  'chi-siamo': { title: 'Chi siamo' },
  showroom: { title: 'Showroom' },
  'lavora-con-noi': { title: 'Lavora con noi' },
  spedizioni: { title: 'Spedizioni' },
  pagamenti: { title: 'Pagamenti' },
  garanzia: { title: 'Garanzia e resi' },
  contatti: { title: 'Contatti' },
  privacy: { title: 'Privacy' },
  cookie: { title: 'Cookie' },
  'prodotto-non-trovato': { title: 'Prodotto non trovato', description: 'Richiedi un prodotto non in catalogo.' },
}

export function createContentPageRoute(pageKey: SitePageKey) {
  const path = CONTENT_PAGE_PATHS[pageKey]
  const fallback = CONTENT_PAGE_FALLBACKS[pageKey]

  async function generateMetadata(): Promise<Metadata> {
    if (!path || !fallback) return {}
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
