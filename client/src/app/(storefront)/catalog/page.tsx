import type { Metadata } from 'next'
import { t } from '@/i18n/messages'
import { getSiteUrl } from '@/lib/env'
import { getRequestLocale } from '@/lib/locale-server'
import { localizePath } from '@/lib/locale'
import { buildMetadata } from '@/lib/seo'
import { catalogHasFilterQuery } from '@/lib/seo-paths'
import { CatalogPage } from '@/views/CatalogPage'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = await getRequestLocale()
  const params = await searchParams
  const hasFilters = catalogHasFilterQuery(params)
  const site = getSiteUrl().replace(/\/$/, '')
  const catalogPath = localizePath('/catalog', locale)
  return buildMetadata({
    title: `${t(locale, 'catalog.title')} | Idea di Luce`,
    description: t(locale, 'catalog.metaDescription'),
    canonical: hasFilters ? null : `${site}${catalogPath}`,
    noindex: hasFilters,
  })
}

export default function Page() {
  return <CatalogPage />
}
