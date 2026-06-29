import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/locale-server'
import { buildLegacySeoMetadata } from '@/lib/legacy-seo-pages'
import { catalogHasFilterQuery } from '@/lib/seo-paths'
import { fetchCatalogProductsServer } from '@/lib/server-catalog'
import { CatalogPage } from '@/views/CatalogPage'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateCatalogMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const hasFilters = catalogHasFilterQuery(params)

  if (hasFilters) {
    const legacy = await buildLegacySeoMetadata('negozio', { noindex: true, canonical: null })
    return legacy
  }

  return buildLegacySeoMetadata('negozio')
}

export async function CatalogRoutePage({ searchParams }: PageProps) {
  const locale = await getRequestLocale()
  const params = await searchParams
  const hasFilters = catalogHasFilterQuery(params)
  const initialProducts = hasFilters
    ? undefined
    : (await fetchCatalogProductsServer(locale, { pageSize: 24 })).items

  return <CatalogPage initialProducts={initialProducts} />
}
