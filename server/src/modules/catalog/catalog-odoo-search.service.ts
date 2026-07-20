/**
 * Search + filters catalogo live verso Odoo v2
 * (`GET /api/v2/products/search`, `GET /api/v2/filters`).
 * La cache indice locale non entra in questi path (solo typeahead suggest).
 */
import {
  OdooCatalogClientError,
  fetchOdooCatalogFilters,
  fetchOdooCatalogProductSearch,
  isOdooCatalogConfigured,
  toOdooCatalogError,
} from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { mapOdooCatalogListResponse } from '../../adapters/odoo-catalog/odooCatalogMapper.js'
import type {
  OdooCatalogFacetCategory,
  OdooCatalogFacetValue,
  OdooCatalogFiltersResponse,
} from '../../adapters/odoo-catalog/odooCatalog.types.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import type { CategoryDTO, ProductListDTO } from '../../types/dto.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { sanitizeCatalogSearchQuery } from './catalog-search-guard.js'
import {
  sanitizeAttaccoParam,
  sanitizeColorTempParam,
} from './catalog-spec-filter.js'
import { enrichProductCardsWithStock, type ProductCardStockHint } from './catalog-stock.enrich.js'
import type { PricingContext } from '../pricing/pricelist.service.js'
import { canonicalizeBrandSlug } from './odoo-catalog-slug.js'

export type CatalogSearchOptions = {
  locale?: string
  page?: number
  pageSize?: number
  q?: string
  world?: 'design' | 'technical' | string
  categorySlug?: string
  subcategorySlug?: string
  brandSlug?: string
  tipologia?: string
  ambiente?: string
  stile?: string
  attacco?: string
  wattaggio?: string | number
  wattaggioMin?: string | number
  wattaggioMax?: string | number
  colorTemp?: string
  tag?: string
  sort?: string
  partnerId?: number
  pricelistId?: number
  pricing?: PricingContext | null
  /** Se true, arricchisce stock (listing negozio autenticato). Default true. */
  enrichStock?: boolean
}

export type CatalogFiltersFacetOptionDTO = {
  value: string
  label: string
  count: number
}

export type CatalogFiltersCategoryDTO = {
  slug: string
  name: string
  parentSlug: string | null
  count: number
  children: CatalogFiltersCategoryDTO[]
}

export type CatalogFiltersDTO = {
  totalMatching: number
  appliedFilters: Record<string, unknown>
  worlds: CatalogFiltersFacetOptionDTO[]
  categories: CatalogFiltersCategoryDTO[]
  brands: Array<{ slug: string; name: string; count: number }>
  tipologie: CatalogFiltersFacetOptionDTO[]
  ambienti: CatalogFiltersFacetOptionDTO[]
  stili: CatalogFiltersFacetOptionDTO[]
  attacchi: CatalogFiltersFacetOptionDTO[]
  wattaggi: CatalogFiltersFacetOptionDTO[]
  colorTemps: CatalogFiltersFacetOptionDTO[]
  tags: CatalogFiltersFacetOptionDTO[]
  specs: Array<{
    key: string
    label: string
    unit: string
    values: Array<{ value: string; label: string; count: number }>
  }>
}

function mapFacetValue(item: OdooCatalogFacetValue): CatalogFiltersFacetOptionDTO {
  return {
    value: String(item.value),
    label: item.label,
    count: item.count,
  }
}

function mapFacetCategory(item: OdooCatalogFacetCategory): CatalogFiltersCategoryDTO {
  return {
    slug: item.slug,
    name: item.name,
    parentSlug: item.parent_slug ?? null,
    count: item.count,
    children: (item.children ?? []).map(mapFacetCategory),
  }
}

export function mapOdooCatalogFiltersResponse(raw: OdooCatalogFiltersResponse): CatalogFiltersDTO {
  return {
    totalMatching: raw.total_matching,
    appliedFilters: raw.applied_filters ?? {},
    worlds: (raw.worlds ?? []).map(mapFacetValue),
    categories: (raw.categories ?? []).map(mapFacetCategory),
    brands: (raw.brands ?? []).map((b) => ({
      slug: canonicalizeBrandSlug(b.slug),
      name: b.name,
      count: b.count,
    })),
    tipologie: (raw.tipologie ?? []).map(mapFacetValue),
    ambienti: (raw.ambienti ?? []).map(mapFacetValue),
    stili: (raw.stili ?? []).map(mapFacetValue),
    attacchi: (raw.attacchi ?? []).map(mapFacetValue),
    wattaggi: (raw.wattaggi ?? []).map(mapFacetValue),
    colorTemps: (raw.color_temps ?? []).map(mapFacetValue),
    tags: (raw.tags ?? []).map(mapFacetValue),
    specs: (raw.specs ?? []).map((s) => ({
      key: s.key,
      label: s.label,
      unit: s.unit ?? '',
      values: (s.values ?? []).map((v) => ({
        value: String(v.value),
        label: v.label ?? v.display ?? String(v.value),
        count: v.count,
      })),
    })),
  }
}

function emptyList(pageSize: number): ProductListDTO {
  return {
    items: [],
    page: 1,
    pageSize,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  }
}

function emptyFilters(): CatalogFiltersDTO {
  return {
    totalMatching: 0,
    appliedFilters: {},
    worlds: [],
    categories: [],
    brands: [],
    tipologie: [],
    ambienti: [],
    stili: [],
    attacchi: [],
    wattaggi: [],
    colorTemps: [],
    tags: [],
    specs: [],
  }
}

function toSearchUpstream(options: CatalogSearchOptions, locale: HubLocale) {
  const page = Math.max(1, Number(options.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(options.pageSize) || 24))
  const colorTemp = sanitizeColorTempParam(options.colorTemp)
  // Odoo accetta `3000` o `3000K`; inviamo le cifre senza K per allineamento facet.
  const colorTempParam = colorTemp?.replace(/K$/i, '')

  return {
    locale,
    page,
    per_page: perPage,
    q: sanitizeCatalogSearchQuery(options.q) || undefined,
    world: options.world,
    category: options.categorySlug,
    subcategory: options.subcategorySlug,
    brand: options.brandSlug ? canonicalizeBrandSlug(options.brandSlug) : undefined,
    tipologia: options.tipologia,
    ambiente: options.ambiente,
    stile: options.stile,
    attacco: sanitizeAttaccoParam(options.attacco),
    wattaggio: options.wattaggio,
    wattaggio_min: options.wattaggioMin,
    wattaggio_max: options.wattaggioMax,
    color_temp: colorTempParam,
    tag: options.tag,
    sort: options.sort,
  }
}

export async function searchCatalogProductsLive(
  ctx: OdooCallContext,
  options: CatalogSearchOptions,
): Promise<ProductListDTO> {
  const locale = parseHubLocale(options.locale)
  const pageSize = Math.min(100, Math.max(1, Number(options.pageSize) || 24))

  if (!isOdooCatalogConfigured()) return emptyList(pageSize)

  try {
    const raw = await fetchOdooCatalogProductSearch(toSearchUpstream(options, locale))
    const mapped = mapOdooCatalogListResponse(raw, locale)

    if (options.enrichStock === false) return mapped

    const withHints: ProductCardStockHint[] = mapped.items.map((item) => ({
      ...item,
      odooTemplateId: item.odooTemplateId ?? null,
    }))
    const enrichedItems = await enrichProductCardsWithStock(ctx, withHints)
    return { ...mapped, items: enrichedItems }
  } catch (e) {
    if (e instanceof OdooCatalogClientError) throw toOdooCatalogError(e, ctx.correlationId)
    throw e
  }
}

export async function getCatalogFiltersLive(
  ctx: OdooCallContext,
  options: Omit<CatalogSearchOptions, 'page' | 'pageSize' | 'sort' | 'enrichStock'>,
): Promise<CatalogFiltersDTO> {
  const locale = parseHubLocale(options.locale)
  if (!isOdooCatalogConfigured()) return emptyFilters()

  try {
    const upstream = toSearchUpstream({ ...options, page: 1, pageSize: 24 }, locale)
    const { page: _p, per_page: _pp, sort: _s, ...filters } = upstream
    const raw = await fetchOdooCatalogFilters(filters)
    return mapOdooCatalogFiltersResponse(raw)
  } catch (e) {
    if (e instanceof OdooCatalogClientError) throw toOdooCatalogError(e, ctx.correlationId)
    throw e
  }
}

function flattenFilterCategories(
  nodes: CatalogFiltersCategoryDTO[],
  parentId: string | null = null,
): CategoryDTO[] {
  const out: CategoryDTO[] = []
  for (const node of nodes) {
    out.push({
      id: node.slug,
      slug: node.slug,
      name: node.name,
      parentId,
    })
    if (node.children?.length) {
      out.push(...flattenFilterCategories(node.children, node.slug))
    }
  }
  return out
}

/** Brand hub / nav: facet live Odoo, non indice cache. */
export async function listCatalogBrandsLive(
  localeInput?: string,
): Promise<Array<{ slug: string; name: string; productCount: number }>> {
  if (!isOdooCatalogConfigured()) return []
  const locale = parseHubLocale(localeInput)
  const raw = await fetchOdooCatalogFilters({ locale })
  return (raw.brands ?? [])
    .map((b) => ({
      slug: canonicalizeBrandSlug(b.slug),
      name: b.name,
      productCount: b.count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'it'))
}

/** Categorie hub / nav: facet live Odoo, non indice cache. */
export async function listCatalogCategoriesLive(localeInput?: string): Promise<CategoryDTO[]> {
  if (!isOdooCatalogConfigured()) return []
  const locale = parseHubLocale(localeInput)
  const raw = await fetchOdooCatalogFilters({ locale })
  const mapped = mapOdooCatalogFiltersResponse(raw)
  return flattenFilterCategories(mapped.categories)
}
