import type { Metadata } from 'next'
import { CategoryPage } from '@/views/CategoryPage'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { getSiteUrl } from '@/lib/env'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from '@/lib/seo/json-ld'
import {
  buildLocalizedPageSeo,
  categorySeoPath,
} from '@/lib/seo-paths'
import { fetchCatalogProductsServer, fetchCategoryMetaServer } from '@/lib/server-catalog'

export const revalidate = 1800

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateCategoryMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const category = await fetchCategoryMetaServer(slug, locale)
  const name = category?.name ?? slug
  const { canonical, alternates } = buildLocalizedPageSeo({
    currentLocale: locale,
    pathForLocale: () => categorySeoPath(slug),
  })
  return buildMetadata({
    title: name,
    description: `Scopri i prodotti nella categoria ${name} su Idea di Luce.`,
    canonical,
    alternates,
  })
}

export async function CategoryListRoute({ params }: PageProps) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const [category, productsRes] = await Promise.all([
    fetchCategoryMetaServer(slug, locale),
    fetchCatalogProductsServer(locale, { category: slug, pageSize: 48 }),
  ])
  const name = category?.name ?? slug
  const { canonical } = buildLocalizedPageSeo({
    currentLocale: locale,
    pathForLocale: () => categorySeoPath(slug),
  })
  const site = getSiteUrl().replace(/\/$/, '')

  return (
    <>
      <JsonLdGraph
        items={[
          buildCollectionPageJsonLd({
            name,
            description: `Prodotti nella categoria ${name}`,
            url: canonical,
            products: productsRes.items,
          }),
          buildBreadcrumbJsonLd([
            { name: 'Home', url: site },
            { name: 'Negozio', url: `${site}/negozio` },
            { name, url: canonical },
          ]),
        ]}
      />
      <CategoryPage
        initialProducts={productsRes.items}
        initialCategoryName={name}
      />
    </>
  )
}
