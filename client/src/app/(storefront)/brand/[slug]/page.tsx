import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CatalogPage } from '@/views/CatalogPage'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { getSiteUrl } from '@/lib/env'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from '@/lib/seo/json-ld'
import { brandSeoPath, buildLocalizedPageSeo } from '@/lib/seo-paths'
import { fetchBrandMetaServer, fetchCatalogProductsServer } from '@/lib/server-catalog'

export const revalidate = 1800

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const brand = await fetchBrandMetaServer(slug, locale)
  if (!brand) {
    return { title: 'Brand non trovato', robots: { index: false, follow: false } }
  }
  const name = brand.name
  const { canonical, alternates } = buildLocalizedPageSeo({
    currentLocale: locale,
    pathForLocale: () => brandSeoPath(slug),
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
  const [brand, productsRes] = await Promise.all([
    fetchBrandMetaServer(slug, locale),
    fetchCatalogProductsServer(locale, { brand: slug, pageSize: 24 }),
  ])
  if (!brand) notFound()
  const name = brand.name
  const { canonical } = buildLocalizedPageSeo({
    currentLocale: locale,
    pathForLocale: () => brandSeoPath(slug),
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
      <CatalogPage forcedBrandSlug={slug} initialProducts={productsRes.items} />
    </>
  )
}
