import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { getAmbientiRoomMeta } from '@/lib/ambienti.defaults'
import { getSiteUrl } from '@/lib/env'
import { localizePath } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from '@/lib/seo/json-ld'
import { fetchCatalogProductsServer, fetchCategoryMetaServer } from '@/lib/server-catalog'
import { fetchContentPageServer } from '@/lib/server-site-cache'
import { isEditorialPage } from '@/lib/site-page-keys'
import {
  resolveWpCategoryProdottoView,
  wpCategoryProdottoPathFromSegments,
} from '@/lib/wp-category-prodotto-path'
import type { EditorialPageContent } from '@/types/site-content'
import { AmbienteRoomView } from '@/views/AmbienteRoomView'
import { AmbientiPage } from '@/views/AmbientiPage'
import { CategoryPage } from '@/views/CategoryPage'
import { CategoryLandingRoutePage } from '@/app/_shared/category-landing-route'

type RouteProps = {
  segments: string[]
  searchParams?: Record<string, string | string[] | undefined>
}

function wpCanonicalPath(segments: string[], locale: ReturnType<typeof getRequestLocale> extends Promise<infer T> ? T : never) {
  const site = getSiteUrl().replace(/\/$/, '')
  const path = wpCategoryProdottoPathFromSegments(segments)
  return `${site}${localizePath(path, locale)}`
}

export async function generateWpCategoryProdottoMetadata({
  segments,
  searchParams = {},
}: RouteProps): Promise<Metadata> {
  const view = resolveWpCategoryProdottoView(segments)
  if (!view) return { title: 'Pagina non trovata' }

  const locale = await getRequestLocale()
  const canonical = wpCanonicalPath(segments, locale)

  if (view.kind === 'landing') {
    const landingMeta: Record<
      'design' | 'technical' | 'technical-products',
      { title: string; description: string }
    > = {
      design: {
        title: "Illuminazione d'arredo",
        description:
          'Scegli il modello che accende il tuo stile: lampade da parete, sospensione, incasso, soffitto, tavolo e terra.',
      },
      technical: {
        title: 'Illuminazione tecnica',
        description: 'Lampadine, alimentatori, portalampade e componenti per illuminazione professionale.',
      },
      'technical-products': {
        title: 'Prodotti tecnici',
        description: 'Alimentatori, driver, trasformatori e componenti per installazioni tecniche.',
      },
    }
    const meta = landingMeta[view.pageKey]
    const hasFilters = Object.keys(searchParams).some((k) => ['f', 'brand', 'sort', 'inStock', 'minPrice', 'maxPrice'].includes(k))
    return buildMetadata({
      title: meta.title,
      description: meta.description,
      canonical: hasFilters ? null : canonical,
      noindex: hasFilters,
    })
  }

  if (view.kind === 'ambiente-hub') {
    return buildMetadata({
      title: 'Acquista per ambiente',
      description:
        'Illuminazione per soggiorno, cucina, camera da letto, bagno, studio ed esterno. Ogni spazio, una luce.',
      canonical,
    })
  }

  if (view.kind === 'ambiente-room') {
    const roomMeta = getAmbientiRoomMeta(view.room)
    if (!roomMeta) return { title: 'Ambiente non trovato' }
    const title = `Illuminazione per ${view.room === 'esterno' ? 'esterni' : view.room}`
    return buildMetadata({ title, description: roomMeta.description, canonical })
  }

  const category = view.categorySlug
    ? await fetchCategoryMetaServer(view.categorySlug, locale)
    : null
  const name = category?.name ?? view.displaySlug.replace(/-/g, ' ')
  return buildMetadata({
    title: name,
    description: `Scopri i prodotti nella categoria ${name} su Idea di Luce.`,
    canonical,
  })
}

export async function WpCategoryProdottoRoute({ segments }: RouteProps) {
  const view = resolveWpCategoryProdottoView(segments)
  if (!view) notFound()

  const locale = await getRequestLocale()
  const canonical = wpCanonicalPath(segments, locale)
  const site = getSiteUrl().replace(/\/$/, '')

  switch (view.kind) {
    case 'landing':
      return <CategoryLandingRoutePage pageKey={view.pageKey} />

    case 'ambiente-hub': {
      const content = await fetchContentPageServer<EditorialPageContent>('ambienti', locale)
      const initialContent = content && isEditorialPage(content) ? content : null
      return <AmbientiPage initialContent={initialContent} />
    }

    case 'ambiente-room': {
      const roomMeta = getAmbientiRoomMeta(view.room)
      if (!roomMeta) notFound()
      const productsRes = await fetchCatalogProductsServer(locale, {
        category: view.room,
        pageSize: 24,
      })
      const title = `Illuminazione per ${view.room === 'esterno' ? 'esterni' : view.room}`
      return (
        <>
          <JsonLdGraph
            items={[
              buildCollectionPageJsonLd({
                name: title,
                description: roomMeta.description,
                url: canonical,
                products: productsRes.items,
              }),
              buildBreadcrumbJsonLd([
                { name: 'Home', url: site },
                { name: 'Ambienti', url: `${site}${localizePath('/acquista-ambiente', locale)}` },
                { name: title, url: canonical },
              ]),
            ]}
          />
          <AmbienteRoomView room={roomMeta} products={productsRes.items} />
        </>
      )
    }

    case 'catalog': {
      const categorySlug = view.categorySlug || undefined
      const [category, productsRes] = await Promise.all([
        categorySlug ? fetchCategoryMetaServer(categorySlug, locale) : Promise.resolve(null),
        fetchCatalogProductsServer(locale, {
          category: categorySlug,
          pageSize: 48,
        }),
      ])
      const name = category?.name ?? view.displaySlug.replace(/-/g, ' ')
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
                { name: 'Negozio', url: `${site}${localizePath('/negozio', locale)}` },
                { name, url: canonical },
              ]),
            ]}
          />
          <CategoryPage
            categorySlug={categorySlug ?? view.displaySlug}
            initialProducts={productsRes.items}
            initialCategoryName={name}
          />
        </>
      )
    }
  }
}
