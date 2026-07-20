import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CatalogPage } from '@/views/CatalogPage'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { getSiteUrl } from '@/lib/env'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from '@/lib/seo/json-ld'
import { brandSeoPath, buildLocalizedPageSeo } from '@/lib/seo-paths'
import {
  buildBrandTaxonomy,
  canonicalizeBrandSlug,
  humanizeSlug,
} from '@/lib/catalog-taxonomy'
import { fetchBrandMetaServer, fetchCatalogBootstrapServer, fetchCatalogProductsServer } from '@/lib/server-catalog'

export const revalidate = 1800

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const filterSlug = canonicalizeBrandSlug(slug)
  const brand = await fetchBrandMetaServer(filterSlug, locale)
  const name = brand?.name ?? humanizeSlug(filterSlug)
  const { canonical, alternates } = buildLocalizedPageSeo({
    currentLocale: locale,
    pathForLocale: () => brandSeoPath(brand?.slug ?? filterSlug),
  })
  return buildMetadata({
    title: name,
    description: `Catalogo prodotti ${name} — lampade e illuminazione su Idea di Luce.`,
    canonical,
    alternates,
  })
}

export default async function BrandSlugPage({ params }: PageProps) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const filterSlug = canonicalizeBrandSlug(slug)
  const brand = await fetchBrandMetaServer(filterSlug, locale)
  const canonicalSlug = brand?.slug ?? filterSlug

  const [productsRes, initialBootstrap] = await Promise.all([
    fetchCatalogProductsServer(locale, { brand: canonicalSlug, pageSize: 24 }),
    fetchCatalogBootstrapServer(locale),
  ])

  const name =
    brand?.name ?? productsRes.items[0]?.brand?.name ?? humanizeSlug(canonicalSlug)

  if (!brand && productsRes.total === 0) {
    notFound()
  }

  const taxonomy = buildBrandTaxonomy(canonicalSlug, name)
  const { canonical } = buildLocalizedPageSeo({
    currentLocale: locale,
    pathForLocale: () => brandSeoPath(canonicalSlug),
  })
  const site = getSiteUrl().replace(/\/$/, '')

  return (
    <>
      <JsonLdGraph
        items={[
          buildCollectionPageJsonLd({
            name: `Brand ${name}`,
            description: `Catalogo prodotti ${name}`,
            url: canonical,
            products: productsRes.items,
          }),
          buildBreadcrumbJsonLd([
            { name: 'Home', url: site },
            { name: 'Brand', url: `${site}/brand` },
            { name, url: canonical },
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
