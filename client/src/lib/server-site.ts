import 'server-only'

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

export async function fetchShellContentServer(locale: PwaLocale): Promise<SiteShellContent | null> {
  try {
    const q = new URLSearchParams({ locale })
    const data = await serverApiClient.get<SitePageResponse<SiteShellContent>>(
      `/api/v1/site/pages/shell?${q.toString()}`,
    )
    return data.content ?? null
  } catch {
    return null
  }
}

export async function fetchHomeContentServer(locale: PwaLocale): Promise<HomePageContent | null> {
  try {
    const q = new URLSearchParams({ locale })
    const data = await serverApiClient.get<SitePageResponse<unknown>>(
      `/api/v1/site/pages/home?${q.toString()}`,
    )
    const content = data.content
    return content && isHomePageContent(content) ? content : null
  } catch {
    return null
  }
}

export async function fetchProfessionistiContentServer(
  locale: PwaLocale,
): Promise<ProfessionistiPageContent | null> {
  try {
    const q = new URLSearchParams({ locale })
    const data = await serverApiClient.get<SitePageResponse<unknown>>(
      `/api/v1/site/pages/professionisti?${q.toString()}`,
    )
    const content = data.content
    return content && isProfessionistiPageContent(content) ? content : null
  } catch {
    return null
  }
}
