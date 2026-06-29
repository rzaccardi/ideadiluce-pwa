import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/env'
import { localizePath } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { fetchContentPageServer } from '@/lib/server-site-cache'
import { isContentPage } from '@/lib/site-page-keys'
import type { ContentPageContent } from '@/types/site-content'

export async function buildContentPageMetadata(input: {
  pageKey: string
  path: string
  fallbackTitle: string
  fallbackDescription?: string
}): Promise<Metadata> {
  const locale = await getRequestLocale()
  const content = await fetchContentPageServer<ContentPageContent>(input.pageKey, locale)
  const site = getSiteUrl().replace(/\/$/, '')
  const canonical = `${site}${localizePath(input.path, locale)}`

  if (content && isContentPage(content)) {
    return buildMetadata({
      title: content.title,
      description: content.subtitle ?? content.intro ?? input.fallbackDescription,
      canonical,
      noindex: content.seo?.noindex,
      ogType: 'article',
    })
  }

  return buildMetadata({
    title: input.fallbackTitle,
    description: input.fallbackDescription,
    canonical,
  })
}
