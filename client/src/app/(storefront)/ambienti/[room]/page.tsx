import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { getAmbientiRoomMeta } from '@/lib/ambienti.defaults'
import { getSiteUrl } from '@/lib/env'
import { localizePath } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from '@/lib/seo/json-ld'
import { fetchCatalogProductsServer } from '@/lib/server-catalog'
import { AmbienteRoomView } from '@/views/AmbienteRoomView'

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
  const title = `Illuminazione per ${room === 'esterno' ? 'esterni' : room}`

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
  const productsRes = await fetchCatalogProductsServer(locale, {
    category: room,
    pageSize: 24,
  })
  const site = getSiteUrl().replace(/\/$/, '')
  const pageUrl = `${site}${localizePath(`/ambienti/${room}`, locale)}`
  const title = `Illuminazione per ${room === 'esterno' ? 'esterni' : room}`

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
      <AmbienteRoomView room={meta} products={productsRes.items} />
    </>
  )
}
