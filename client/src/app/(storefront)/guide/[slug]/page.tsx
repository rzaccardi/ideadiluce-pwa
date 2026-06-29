import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ContentPage } from '@/views/ContentPage'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { getSiteUrl } from '@/lib/env'
import { localizePath } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { buildArticleJsonLd } from '@/lib/seo/json-ld'
import { fetchContentPageServer } from '@/lib/server-site-cache'
import { guidePageKeyFromSlug, isContentPage } from '@/lib/site-page-keys'
import type { ContentPageContent } from '@/types/site-content'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pageKey = guidePageKeyFromSlug(slug)
  if (!pageKey) return { title: 'Guida non trovata' }

  const locale = await getRequestLocale()
  const content = await fetchContentPageServer<ContentPageContent>(pageKey, locale)
  const site = getSiteUrl().replace(/\/$/, '')
  const canonical = `${site}${localizePath(`/guide/${slug}`, locale)}`

  if (content && isContentPage(content)) {
    return buildMetadata({
      title: content.title,
      description: content.subtitle ?? content.intro,
      canonical,
      noindex: content.seo?.noindex,
      ogType: 'article',
    })
  }

  return buildMetadata({
    title: 'Guida',
    canonical,
    ogType: 'article',
  })
}

export default async function GuideArticlePage({ params }: PageProps) {
  const { slug } = await params
  const pageKey = guidePageKeyFromSlug(slug)
  if (!pageKey) notFound()

  const locale = await getRequestLocale()
  const initialContent = await fetchContentPageServer<ContentPageContent>(pageKey, locale)
  if (initialContent && !isContentPage(initialContent)) notFound()

  const site = getSiteUrl().replace(/\/$/, '')
  const pageUrl = `${site}${localizePath(`/guide/${slug}`, locale)}`
  const articleJsonLd =
    initialContent
      ? buildArticleJsonLd({
          title: initialContent.title,
          description: initialContent.subtitle ?? initialContent.intro,
          url: pageUrl,
        })
      : null

  return (
    <>
      <JsonLdGraph items={[articleJsonLd]} />
      <ContentPage
        pageKey={pageKey}
        initialContent={initialContent}
        breadcrumb={[{ label: 'Guide', to: '/guide' }, { label: initialContent?.title ?? slug }]}
      />
    </>
  )
}
