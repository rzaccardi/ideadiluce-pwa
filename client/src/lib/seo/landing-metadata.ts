import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/env'
import { localizePath } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { landingHasFilterQuery } from '@/lib/seo-paths'

export async function buildCategoryLandingMetadata(input: {
  title: string
  description: string
  path: string
  searchParams: Record<string, string | string[] | undefined>
}): Promise<Metadata> {
  const locale = await getRequestLocale()
  const hasFilters = landingHasFilterQuery(input.searchParams)
  const site = getSiteUrl().replace(/\/$/, '')
  const canonical = hasFilters ? null : `${site}${localizePath(input.path, locale)}`

  return buildMetadata({
    title: input.title,
    description: input.description,
    canonical,
    noindex: hasFilters,
  })
}
