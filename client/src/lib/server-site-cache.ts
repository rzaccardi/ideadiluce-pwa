import 'server-only'

import { unstable_cache } from 'next/cache'
import { serverApiClient } from '@/api/server'
import type { PwaLocale } from '@/lib/locale'
import type { HomePageContent, ProfessionistiPageContent, SiteShellContent } from '@/types/site-content'
import { isHomePageContent, isProfessionistiPageContent } from '@/lib/site-page-keys'

type SitePageResponse<T> = {
  pageKey: string
  locale: string
  content: T
  updatedAt: string | null
}

const CMS_REVALIDATE_SECONDS = 300

async function fetchSitePageRaw<T>(pageKey: string, locale: PwaLocale): Promise<T | null> {
  try {
    const q = new URLSearchParams({ locale })
    const data = await serverApiClient.get<SitePageResponse<T>>(
      `/api/v1/site/pages/${pageKey}?${q.toString()}`,
    )
    return data.content ?? null
  } catch {
    return null
  }
}

function cachedSitePage<T>(pageKey: string, locale: PwaLocale) {
  return unstable_cache(
    () => fetchSitePageRaw<T>(pageKey, locale),
    ['site-page', pageKey, locale],
    {
      revalidate: CMS_REVALIDATE_SECONDS,
      tags: ['site-cms', `site-cms:${pageKey}`, `site-cms:${pageKey}:${locale}`],
    },
  )()
}

export function fetchShellContentServer(locale: PwaLocale): Promise<SiteShellContent | null> {
  return cachedSitePage<SiteShellContent>('shell', locale)
}

export async function fetchHomeContentServer(locale: PwaLocale): Promise<HomePageContent | null> {
  const content = await cachedSitePage<unknown>('home', locale)
  return content && isHomePageContent(content) ? content : null
}

export async function fetchProfessionistiContentServer(
  locale: PwaLocale,
): Promise<ProfessionistiPageContent | null> {
  const content = await cachedSitePage<unknown>('professionisti', locale)
  return content && isProfessionistiPageContent(content) ? content : null
}
