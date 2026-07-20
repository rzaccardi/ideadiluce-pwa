import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/locale-server'
import { buildLegacySeoMetadata } from '@/lib/legacy-seo-pages'
import { catalogHasFilterQuery } from '@/lib/seo-paths'
import {
  CATALOG_DESIGN_CATEGORY_SLUG,
  CATALOG_TECHNICAL_CATEGORY_SLUG,
  parseCatalogWorld,
} from '@/lib/catalog-filters'
import { fetchCatalogProductsServer, fetchCatalogBootstrapServer } from '@/lib/server-catalog'
import { CatalogPage } from '@/views/CatalogPage'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0]?.trim() || undefined
  return value?.trim() || undefined
}

/** Risolve filtri server-side per seed SSR (world → categoria radice). */
function resolveCatalogSsrFilters(
  params: Record<string, string | string[] | undefined>,
): {
  q?: string
  category?: string
  brand?: string
  attacco?: string
  colorTemp?: string
  tipologia?: string
  ambiente?: string
  stile?: string
  tag?: string
  world?: 'design' | 'technical'
  sort?: string
} {
  const worldTab = parseCatalogWorld(firstParam(params.world))
  const categoryParam = firstParam(params.category)
  const category =
    categoryParam ||
    (worldTab === 'design'
      ? CATALOG_DESIGN_CATEGORY_SLUG
      : worldTab === 'technical'
        ? CATALOG_TECHNICAL_CATEGORY_SLUG
        : undefined)
  const world = worldTab === 'design' || worldTab === 'technical' ? worldTab : undefined
  const sort = firstParam(params.sort)

  return {
    q: firstParam(params.q),
    category,
    brand: firstParam(params.brand),
    attacco: firstParam(params.attacco),
    colorTemp: firstParam(params.colorTemp),
    tipologia: firstParam(params.tipologia),
    ambiente: firstParam(params.ambiente),
    stile: firstParam(params.stile),
    tag: firstParam(params.tag),
    world,
    sort,
  }
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
  const ssrFilters = resolveCatalogSsrFilters(params)

  const [productsRes, initialBootstrap] = await Promise.all([
    fetchCatalogProductsServer(locale, {
      pageSize: 24,
      q: ssrFilters.q,
      category: ssrFilters.category,
      brand: ssrFilters.brand,
      attacco: ssrFilters.attacco,
      colorTemp: ssrFilters.colorTemp,
      tipologia: ssrFilters.tipologia,
      ambiente: ssrFilters.ambiente,
      stile: ssrFilters.stile,
      tag: ssrFilters.tag,
      world: ssrFilters.world,
      sort: ssrFilters.sort,
    }),
    fetchCatalogBootstrapServer(locale),
  ])

  return (
    <CatalogPage
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
  )
}
