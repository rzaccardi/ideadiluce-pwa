import type { Metadata } from 'next'
import { CatalogPage } from '@/views/CatalogPage'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { getSiteUrl } from '@/lib/env'
import { localizePath } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from '@/lib/seo/json-ld'
import {
  buildAttaccoTaxonomy,
  attaccoPathSlugFromCode,
  taxonomyPageTitle,
} from '@/lib/catalog-taxonomy'
import { fetchCatalogBootstrapServer, fetchCatalogProductsServer } from '@/lib/server-catalog'

export const revalidate = 1800

type PageProps = {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params
  const taxonomy = buildAttaccoTaxonomy(code)
  const title = taxonomyPageTitle(taxonomy)
  const locale = await getRequestLocale()
  const site = getSiteUrl().replace(/\/$/, '')
  const slug = attaccoPathSlugFromCode(taxonomy.value)
  const canonical = `${site}${localizePath(`/attacco/${slug}`, locale)}`
  return buildMetadata({
    title,
    description: `Lampadine e prodotti compatibili con attacco ${taxonomy.label}.`,
    canonical,
  })
}

export default async function AttaccoCodePage({ params }: PageProps) {
  const { code } = await params
  const taxonomy = buildAttaccoTaxonomy(code)
  const locale = await getRequestLocale()
  const [productsRes, initialBootstrap] = await Promise.all([
    fetchCatalogProductsServer(locale, {
      pageSize: 24,
      world: 'technical',
      attacco: taxonomy.value,
    }),
    fetchCatalogBootstrapServer(locale),
  ])
  const site = getSiteUrl().replace(/\/$/, '')
  const title = taxonomyPageTitle(taxonomy)
  const slug = attaccoPathSlugFromCode(taxonomy.value)
  const pageUrl = `${site}${localizePath(`/attacco/${slug}`, locale)}`

  return (
    <>
      <JsonLdGraph
        items={[
          buildCollectionPageJsonLd({
            name: title,
            description: `Prodotti per attacco ${taxonomy.label}`,
            url: pageUrl,
            products: productsRes.items,
          }),
          buildBreadcrumbJsonLd([
            { name: 'Home', url: site },
            { name: 'Attacco', url: `${site}${localizePath('/attacco', locale)}` },
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
