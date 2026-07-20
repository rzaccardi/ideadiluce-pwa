import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import { isCatalogProductPurchasable } from '@/lib/product-availability'
import {
  filterProductsBySpec,
  filterProductsByWorld,
  type CatalogSpecFilters,
} from '@/lib/catalog-filters'
import type { PwaLocale } from '@/lib/locale'
import type { ProductCardDTO } from '@/types/dto'
import type { CatalogSort } from './catalog.store'
import { ApiRequestError } from '@/types/api'
import { catalogStore } from './catalog.store'
import { seedSitePageContent } from '@/features/site'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore catalogo'
}

function applyClientFilters(
  products: ProductCardDTO[],
  filters: {
    inStockOnly?: boolean
    minPriceCents?: number
    maxPriceCents?: number
    sort?: CatalogSort
    locale?: string
  },
) {
  let list = [...products]
  if (filters.minPriceCents != null) {
    list = list.filter((p) => p.priceCents >= filters.minPriceCents!)
  }
  if (filters.maxPriceCents != null) {
    list = list.filter((p) => p.priceCents <= filters.maxPriceCents!)
  }
  if (filters.inStockOnly) {
    list = list.filter((p) =>
      isCatalogProductPurchasable(p, (filters.locale ?? 'IT') as PwaLocale),
    )
  }
  switch (filters.sort) {
    case 'price_asc':
      list.sort((a, b) => a.priceCents - b.priceCents)
      break
    case 'price_desc':
      list.sort((a, b) => b.priceCents - a.priceCents)
      break
    case 'name_asc':
      list.sort((a, b) => a.name.localeCompare(b.name, 'it'))
      break
    default:
      break
  }
  return list
}

function applyCatalogClientFilters(
  products: ProductCardDTO[],
  filters: {
    inStockOnly?: boolean
    minPriceCents?: number
    maxPriceCents?: number
    sort?: CatalogSort
    locale?: string
    attacco?: string
    colorTemp?: string
    world?: 'design' | 'technical'
    /** Se true, attacco/Kelvin/world sono già applicati server-side. */
    serverSideCatalogFilters?: boolean
  },
) {
  let list = applyClientFilters(products, {
    inStockOnly: filters.inStockOnly,
    minPriceCents: filters.minPriceCents,
    maxPriceCents: filters.maxPriceCents,
    // Sort gestito da Odoo search quando serverSideCatalogFilters.
    sort: filters.serverSideCatalogFilters ? undefined : filters.sort,
    locale: filters.locale,
  })
  if (filters.serverSideCatalogFilters) return list
  const specFilters: CatalogSpecFilters = {
    attacco: filters.attacco,
    colorTemp: filters.colorTemp,
  }
  list = filterProductsBySpec(list, specFilters)
  if (filters.world) {
    list = filterProductsByWorld(list, filters.world)
  }
  return list
}

export function catalogServerFetchKey(filters: {
  q?: string
  categorySlug?: string
  brandSlug?: string
  attacco?: string
  colorTemp?: string
  wattaggio?: string
  wattaggioMin?: string
  wattaggioMax?: string
  tipologia?: string
  ambiente?: string
  stile?: string
  tag?: string
  world?: 'design' | 'technical'
  sort?: CatalogSort
  page: number
  pageSize: number
  locale: string
}) {
  return [
    filters.q ?? '',
    filters.categorySlug ?? '',
    filters.brandSlug ?? '',
    filters.attacco ?? '',
    filters.colorTemp ?? '',
    filters.wattaggio ?? '',
    filters.wattaggioMin ?? '',
    filters.wattaggioMax ?? '',
    filters.tipologia ?? '',
    filters.ambiente ?? '',
    filters.stile ?? '',
    filters.tag ?? '',
    filters.world ?? '',
    filters.sort ?? 'relevance',
    filters.page,
    filters.pageSize,
    filters.locale,
  ].join('|')
}

function syncFilterStore(partialFilters?: {
  categorySlug?: string
  brandSlug?: string
  q?: string
  locale?: string
  inStockOnly?: boolean
  minPriceCents?: number
  maxPriceCents?: number
  sort?: CatalogSort
  attacco?: string
  colorTemp?: string
  wattaggio?: string
  wattaggioMin?: string
  wattaggioMax?: string
  tipologia?: string
  ambiente?: string
  stile?: string
  tag?: string
  world?: 'design' | 'technical'
}) {
  if (partialFilters && 'categorySlug' in partialFilters) {
    catalogStore.filters.categorySlug = partialFilters.categorySlug
  }
  if (partialFilters && 'brandSlug' in partialFilters) {
    catalogStore.filters.brandSlug = partialFilters.brandSlug
  }
  if (partialFilters && 'q' in partialFilters) {
    catalogStore.filters.q = partialFilters.q
  }
  if (partialFilters?.locale) {
    catalogStore.filters.locale = partialFilters.locale
  }
  if (partialFilters && 'inStockOnly' in partialFilters) {
    catalogStore.filters.inStockOnly = partialFilters.inStockOnly
  }
  if (partialFilters && 'minPriceCents' in partialFilters) {
    catalogStore.filters.minPriceCents = partialFilters.minPriceCents
  }
  if (partialFilters && 'maxPriceCents' in partialFilters) {
    catalogStore.filters.maxPriceCents = partialFilters.maxPriceCents
  }
  if (partialFilters?.sort) {
    catalogStore.filters.sort = partialFilters.sort
  }
  if (partialFilters && 'attacco' in partialFilters) {
    catalogStore.filters.attacco = partialFilters.attacco
  }
  if (partialFilters && 'colorTemp' in partialFilters) {
    catalogStore.filters.colorTemp = partialFilters.colorTemp
  }
  if (partialFilters && 'wattaggio' in partialFilters) {
    catalogStore.filters.wattaggio = partialFilters.wattaggio
  }
  if (partialFilters && 'wattaggioMin' in partialFilters) {
    catalogStore.filters.wattaggioMin = partialFilters.wattaggioMin
  }
  if (partialFilters && 'wattaggioMax' in partialFilters) {
    catalogStore.filters.wattaggioMax = partialFilters.wattaggioMax
  }
  if (partialFilters && 'tipologia' in partialFilters) {
    catalogStore.filters.tipologia = partialFilters.tipologia
  }
  if (partialFilters && 'ambiente' in partialFilters) {
    catalogStore.filters.ambiente = partialFilters.ambiente
  }
  if (partialFilters && 'stile' in partialFilters) {
    catalogStore.filters.stile = partialFilters.stile
  }
  if (partialFilters && 'tag' in partialFilters) {
    catalogStore.filters.tag = partialFilters.tag
  }
  if (partialFilters && 'world' in partialFilters) {
    catalogStore.filters.world = partialFilters.world
  }
}

function currentClientFilters() {
  return {
    inStockOnly: catalogStore.filters.inStockOnly,
    minPriceCents: catalogStore.filters.minPriceCents,
    maxPriceCents: catalogStore.filters.maxPriceCents,
    sort: catalogStore.filters.sort,
    locale: catalogStore.filters.locale,
    attacco: catalogStore.filters.attacco,
    colorTemp: catalogStore.filters.colorTemp,
    world: catalogStore.filters.world,
    serverSideCatalogFilters: true,
  }
}

export function reapplyCatalogClientFilters() {
  if (!catalogStore.rawProducts.length) return
  catalogStore.products = applyCatalogClientFilters(catalogStore.rawProducts, currentClientFilters())
}

export function seedCatalogProducts(
  items: ProductCardDTO[],
  serverKey: string,
  pagination?: Partial<typeof catalogStore.pagination>,
) {
  catalogStore.rawProducts = items
  catalogStore.serverFetchKey = serverKey
  catalogStore.products = applyCatalogClientFilters(items, {
    ...currentClientFilters(),
    serverSideCatalogFilters: true,
  })
  if (pagination) {
    catalogStore.pagination = { ...catalogStore.pagination, ...pagination }
  }
  catalogStore.isLoading = false
}

export function seedCatalogBootstrap(
  data: {
    categories: import('@/types/dto').CategoryDTO[]
    brands: import('@/types/site-content').BrandListItemDTO[]
    cms?: import('@/types/site-content').CatalogPageContent | null
  },
  locale: string,
) {
  catalogStore.filters.locale = locale
  catalogStore.categories = data.categories
  catalogStore.brands = data.brands
  if (data.cms) {
    seedSitePageContent('catalog', locale, data.cms)
  }
}

export function fetchCatalogBootstrap(options?: { locale?: string; skipIfFresh?: boolean }) {
  const locale = options?.locale ?? catalogStore.filters.locale
  if (
    options?.skipIfFresh &&
    catalogStore.filters.locale === locale &&
    catalogStore.categories.length > 0 &&
    catalogStore.brands.length > 0
  ) {
    return Promise.resolve()
  }
  return dedupeAsync(`catalog:bootstrap:${locale}`, async () => {
    try {
      const data = await api.catalog.bootstrap(locale)
      catalogStore.categories = data.categories
      catalogStore.brands = data.brands
      if (data.cms) {
        seedSitePageContent('catalog', locale, data.cms)
      }
    } catch {
      catalogStore.categories = []
      catalogStore.brands = []
    }
  })
}

export function fetchCategories(options?: { force?: boolean; locale?: string }) {
  const locale = options?.locale ?? catalogStore.filters.locale
  return dedupeAsync(`catalog:categories:${locale}`, async () => {
    try {
      const data = await api.catalog.categories(locale)
      catalogStore.categories = data.items
    } catch {
      catalogStore.categories = []
    }
  })
}

export function fetchBrands(options?: { force?: boolean; locale?: string }) {
  const locale = options?.locale ?? catalogStore.filters.locale
  return dedupeAsync(`catalog:brands:${locale}`, async () => {
    try {
      const data = await api.catalog.brands(locale)
      catalogStore.brands = data.items
    } catch {
      catalogStore.brands = []
    }
  })
}

async function loadProducts(filters: {
  q?: string
  categorySlug?: string
  brandSlug?: string
  page: number
  pageSize: number
  locale: string
  inStockOnly?: boolean
  minPriceCents?: number
  maxPriceCents?: number
  sort?: CatalogSort
  attacco?: string
  colorTemp?: string
  wattaggio?: string
  wattaggioMin?: string
  wattaggioMax?: string
  tipologia?: string
  ambiente?: string
  stile?: string
  tag?: string
  world?: 'design' | 'technical'
}) {
  catalogStore.isLoading = true
  catalogStore.error = null
  try {
    const result = await api.catalog.search({
      q: filters.q,
      category: filters.categorySlug,
      brand: filters.brandSlug,
      attacco: filters.attacco,
      colorTemp: filters.colorTemp,
      wattaggio: filters.wattaggio,
      wattaggioMin: filters.wattaggioMin,
      wattaggioMax: filters.wattaggioMax,
      tipologia: filters.tipologia,
      ambiente: filters.ambiente,
      stile: filters.stile,
      tag: filters.tag,
      world: filters.world,
      sort: filters.sort,
      page: filters.page,
      pageSize: filters.pageSize,
      locale: filters.locale,
    })
    catalogStore.rawProducts = result.items
    catalogStore.serverFetchKey = catalogServerFetchKey(filters)
    catalogStore.products = applyCatalogClientFilters(result.items, {
      ...filters,
      serverSideCatalogFilters: true,
    })
    catalogStore.pagination = {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    }
  } catch (e) {
    catalogStore.error = errMessage(e)
  } finally {
    catalogStore.isLoading = false
  }
}

export function fetchProducts(partialFilters?: {
  categorySlug?: string
  brandSlug?: string
  q?: string
  page?: number
  pageSize?: number
  locale?: string
  inStockOnly?: boolean
  minPriceCents?: number
  maxPriceCents?: number
  sort?: CatalogSort
  attacco?: string
  colorTemp?: string
  wattaggio?: string
  wattaggioMin?: string
  wattaggioMax?: string
  tipologia?: string
  ambiente?: string
  stile?: string
  tag?: string
  world?: 'design' | 'technical'
}) {
  syncFilterStore(partialFilters)

  const page = partialFilters?.page ?? 1
  const pageSize = partialFilters?.pageSize ?? catalogStore.pagination.pageSize
  const serverKey = catalogServerFetchKey({
    q: catalogStore.filters.q,
    categorySlug: catalogStore.filters.categorySlug,
    brandSlug: catalogStore.filters.brandSlug,
    attacco: catalogStore.filters.attacco,
    colorTemp: catalogStore.filters.colorTemp,
    wattaggio: catalogStore.filters.wattaggio,
    wattaggioMin: catalogStore.filters.wattaggioMin,
    wattaggioMax: catalogStore.filters.wattaggioMax,
    tipologia: catalogStore.filters.tipologia,
    ambiente: catalogStore.filters.ambiente,
    stile: catalogStore.filters.stile,
    tag: catalogStore.filters.tag,
    world: catalogStore.filters.world,
    sort: catalogStore.filters.sort,
    page,
    pageSize,
    locale: catalogStore.filters.locale,
  })

  if (
    page === 1 &&
    serverKey === catalogStore.serverFetchKey
  ) {
    reapplyCatalogClientFilters()
    return Promise.resolve()
  }

  const filters = {
    q: catalogStore.filters.q,
    categorySlug: catalogStore.filters.categorySlug,
    brandSlug: catalogStore.filters.brandSlug,
    locale: catalogStore.filters.locale,
    page,
    pageSize,
    inStockOnly: catalogStore.filters.inStockOnly,
    minPriceCents: catalogStore.filters.minPriceCents,
    maxPriceCents: catalogStore.filters.maxPriceCents,
    sort: catalogStore.filters.sort,
    attacco: catalogStore.filters.attacco,
    colorTemp: catalogStore.filters.colorTemp,
    wattaggio: catalogStore.filters.wattaggio,
    wattaggioMin: catalogStore.filters.wattaggioMin,
    wattaggioMax: catalogStore.filters.wattaggioMax,
    tipologia: catalogStore.filters.tipologia,
    ambiente: catalogStore.filters.ambiente,
    stile: catalogStore.filters.stile,
    tag: catalogStore.filters.tag,
    world: catalogStore.filters.world,
  }

  return dedupeAsync(`catalog:products:${serverKey}`, () => loadProducts(filters))
}

export async function fetchNextProductsPage() {
  if (catalogStore.isLoading || catalogStore.isLoadingMore || !catalogStore.pagination.hasNextPage) {
    return
  }
  catalogStore.isLoadingMore = true
  catalogStore.error = null
  try {
    const result = await api.catalog.search({
      q: catalogStore.filters.q,
      category: catalogStore.filters.categorySlug,
      brand: catalogStore.filters.brandSlug,
      attacco: catalogStore.filters.attacco,
      colorTemp: catalogStore.filters.colorTemp,
      wattaggio: catalogStore.filters.wattaggio,
      wattaggioMin: catalogStore.filters.wattaggioMin,
      wattaggioMax: catalogStore.filters.wattaggioMax,
      tipologia: catalogStore.filters.tipologia,
      ambiente: catalogStore.filters.ambiente,
      stile: catalogStore.filters.stile,
      tag: catalogStore.filters.tag,
      world: catalogStore.filters.world,
      sort: catalogStore.filters.sort,
      page: catalogStore.pagination.page + 1,
      pageSize: catalogStore.pagination.pageSize,
      locale: catalogStore.filters.locale,
    })
    catalogStore.rawProducts = [...catalogStore.rawProducts, ...result.items]
    catalogStore.products = applyCatalogClientFilters(catalogStore.rawProducts, currentClientFilters())
    catalogStore.pagination = {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    }
  } catch (e) {
    catalogStore.error = errMessage(e)
  } finally {
    catalogStore.isLoadingMore = false
  }
}

export async function fetchProductsByQuery(
  q: string,
  options: { pageSize?: number; locale: string; category?: string },
): Promise<ProductCardDTO[]> {
  const pageSize = options.pageSize ?? 4
  const result = await api.catalog.search({
    q: q.trim() || undefined,
    category: options.category,
    page: 1,
    pageSize,
    locale: options.locale,
  })
  if (result.items.length > 0 || !q.trim() || !options.category) return result.items

  const fallback = await api.catalog.search({
    category: options.category,
    page: 1,
    pageSize,
    locale: options.locale,
  })
  return fallback.items
}

/**
 * Carica i facet per la sidebar.
 *
 * Richiede solo `world` + `q` (+ locale): se inoltrassimo category / brand /
 * attacco / tassonomie, Odoo restringerebbe i facet al sottoinsieme filtrato
 * (es. `category=scarica` nasconde altri attacchi e le categorie sibling).
 * La selezione resta in URL / store; qui servono tutte le opzioni navigabili.
 */
export async function fetchCatalogFilters(partial?: {
  q?: string
  /** Ignorato per i facet UI — vedi commento sopra. */
  categorySlug?: string
  /** Ignorato per i facet UI. */
  brandSlug?: string
  /** Ignorato per i facet UI. */
  attacco?: string
  /** Ignorato per i facet UI. */
  colorTemp?: string
  /** Ignorato per i facet UI. */
  wattaggio?: string
  /** Ignorato per i facet UI. */
  wattaggioMin?: string
  /** Ignorato per i facet UI. */
  wattaggioMax?: string
  /** Ignorato per i facet UI. */
  tipologia?: string
  /** Ignorato per i facet UI. */
  ambiente?: string
  /** Ignorato per i facet UI. */
  stile?: string
  world?: 'design' | 'technical'
  locale?: string
}) {
  try {
    const data = await api.catalog.filters({
      q: partial?.q ?? catalogStore.filters.q,
      world: partial?.world ?? catalogStore.filters.world,
      locale: partial?.locale ?? catalogStore.filters.locale,
    })
    catalogStore.facets = data
    return data
  } catch {
    catalogStore.facets = null
    return null
  }
}
