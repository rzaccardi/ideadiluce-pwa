import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CatalogPage } from '@/views/CatalogPage'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { getAmbientiRoomMeta } from '@/lib/ambienti.defaults'
import { getSiteUrl } from '@/lib/env'
import { localizePath } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from '@/lib/seo/json-ld'
import { buildAmbienteTaxonomy, humanizeSlug, taxonomyPageTitle } from '@/lib/catalog-taxonomy'
import { fetchCatalogBootstrapServer, fetchCatalogProductsServer } from '@/lib/server-catalog'

type PageProps = {
  params: Promise<{ room: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { room } = await params
  const meta = getAmbientiRoomMeta(room)
  if (!meta) return { title: 'Ambiente non trovato' }

  const locale = await getRequestLocale()
  const site = getSiteUrl().replace(/\/$/, '')
  const canonical = `${site}${localizePath(`/ambienti/${room}`, locale)}`
  const taxonomy = buildAmbienteTaxonomy(room, humanizeSlug(room))
  const title = taxonomyPageTitle(taxonomy)

  return buildMetadata({
    title,
    description: meta.description,
    canonical,
  })
}

export default async function AmbienteRoomPage({ params }: PageProps) {
  const { room } = await params
  const meta = getAmbientiRoomMeta(room)
  if (!meta) notFound()

  const locale = await getRequestLocale()
  const taxonomy = buildAmbienteTaxonomy(room, humanizeSlug(room))
  const [productsRes, initialBootstrap] = await Promise.all([
    fetchCatalogProductsServer(locale, {
      pageSize: 24,
      category: 'arredo',
      ambiente: taxonomy.value,
    }),
    fetchCatalogBootstrapServer(locale),
  ])
  const site = getSiteUrl().replace(/\/$/, '')
  const pageUrl = `${site}${localizePath(`/ambienti/${room}`, locale)}`
  const title = taxonomyPageTitle(taxonomy)

  return (
    <>
      <JsonLdGraph
        items={[
          buildCollectionPageJsonLd({
            name: title,
            description: meta.description,
            url: pageUrl,
            products: productsRes.items,
          }),
          buildBreadcrumbJsonLd([
            { name: 'Home', url: site },
            { name: 'Ambienti', url: `${site}${localizePath('/ambienti', locale)}` },
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
