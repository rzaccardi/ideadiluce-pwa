import type { Metadata } from 'next'
import { CatalogPage } from '@/views/CatalogPage'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { getSiteUrl } from '@/lib/env'
import { localizePath } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from '@/lib/seo/json-ld'
import {
  buildTipologiaTaxonomy,
  humanizeSlug,
  taxonomyPageTitle,
} from '@/lib/catalog-taxonomy'
import { fetchCatalogBootstrapServer, fetchCatalogProductsServer } from '@/lib/server-catalog'

export const revalidate = 1800

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const taxonomy = buildTipologiaTaxonomy(slug)
  taxonomy.label = humanizeSlug(taxonomy.value)
  const title = taxonomyPageTitle(taxonomy)
  const locale = await getRequestLocale()
  const site = getSiteUrl().replace(/\/$/, '')
  const canonical = `${site}${localizePath(`/tipologia/${taxonomy.value}`, locale)}`
  return buildMetadata({
    title,
    description: `Illuminazione d'arredo: tipologia ${taxonomy.label}.`,
    canonical,
  })
}

export default async function TipologiaSlugPage({ params }: PageProps) {
  const { slug } = await params
  const taxonomy = buildTipologiaTaxonomy(slug)
  taxonomy.label = humanizeSlug(taxonomy.value)
  const locale = await getRequestLocale()
  const [productsRes, initialBootstrap] = await Promise.all([
    fetchCatalogProductsServer(locale, {
      pageSize: 24,
      category: 'arredo',
      tipologia: taxonomy.value,
    }),
    fetchCatalogBootstrapServer(locale),
  ])
  const site = getSiteUrl().replace(/\/$/, '')
  const title = taxonomyPageTitle(taxonomy)
  const pageUrl = `${site}${localizePath(`/tipologia/${taxonomy.value}`, locale)}`

  return (
    <>
      <JsonLdGraph
        items={[
          buildCollectionPageJsonLd({
            name: title,
            description: `Tipologia ${taxonomy.label}`,
            url: pageUrl,
            products: productsRes.items,
          }),
          buildBreadcrumbJsonLd([
            { name: 'Home', url: site },
            { name: 'Tipologia', url: `${site}${localizePath(taxonomy.hubPath, locale)}` },
            { name: title, url: pageUrl },
          ]),
        ]}
      />
      <CatalogPage
        forcedTaxonomy={taxonomy}
        initialProducts={productsRes.items}
        initialBootstrap={initialBootstrap}
        initialPagination={{
          page: productsRes.page,
          pageSize: productsRes.pageSize,
          total: productsRes.total,
          totalPages: productsRes.totalPages,
          hasNextPage: productsRes.hasNextPage,
          hasPreviousPage: productsRes.hasPreviousPage,
        }}
      />
    </>
  )
}
