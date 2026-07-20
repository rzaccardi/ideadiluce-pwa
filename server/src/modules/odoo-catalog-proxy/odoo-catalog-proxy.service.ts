/**
 * Proxy BFF verso contratto Odoo v2.
 * Upstream: list, detail, products/search, filters.
 * by-slug: resolve slug→id via search live, poi dettaglio by id.
 * L’indice cache locale non è usato qui (solo typeahead suggest sul BFF catalog).
 */
import {
  OdooCatalogClientError,
  fetchOdooCatalogFilters,
  fetchOdooCatalogProductDetail,
  fetchOdooCatalogProductList,
  fetchOdooCatalogProductSearch,
} from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { findOdooCatalogProductIdBySlug } from '../../adapters/odoo-catalog/odooCatalogSlugIndex.js'
import { parseHubLocale, type HubLocale } from '../../lib/hub-locale.js'
import { buildTechnicalCardSpecTagsFromSpecs } from '../../lib/technical-card-spec-tags.js'

function langFromQuery(locale?: string, lang?: string): HubLocale {
  if (lang?.includes('_')) {
    const code = lang.split('_')[0]?.toUpperCase()
    if (code === 'IT' || code === 'EN' || code === 'ES' || code === 'FR' || code === 'DE') {
      return code
    }
    if (code === 'RO') return 'IT'
  }
  return parseHubLocale(locale)
}

function shouldEnrichSpecTags(value: string | undefined): boolean {
  return value === '1' || value === 'true'
}

function hasLiveSearchFilters(query: {
  q?: string
  category?: string
  subcategory?: string
  brand?: string
  world?: string
  attacco?: string
  color_temp?: string
  colorTemp?: string
  wattaggio?: string
  tag?: string
  tipologia?: string
  ambiente?: string
  stile?: string
}): boolean {
  return Boolean(
    query.q?.trim() ||
      query.category?.trim() ||
      query.subcategory?.trim() ||
      query.brand?.trim() ||
      query.world?.trim() ||
      query.attacco?.trim() ||
      query.color_temp?.trim() ||
      query.colorTemp?.trim() ||
      query.wattaggio?.trim() ||
      query.tag?.trim() ||
      query.tipologia?.trim() ||
      query.ambiente?.trim() ||
      query.stile?.trim(),
  )
}

export async function proxyOdooCatalogProductList(query: {
  locale?: string
  lang?: string
  page?: string
  pageSize?: string
  per_page?: string
  q?: string
  category?: string
  subcategory?: string
  brand?: string
  world?: string
  tipologia?: string
  ambiente?: string
  stile?: string
  attacco?: string
  wattaggio?: string
  wattaggio_min?: string
  wattaggio_max?: string
  color_temp?: string
  colorTemp?: string
  tag?: string
  sort?: string
  partner_id?: string
  pricelist_id?: string
  website?: string
  enrich_spec_tags?: string
}) {
  const locale = langFromQuery(query.locale, query.lang)
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? query.pageSize) || 24))

  if (hasLiveSearchFilters(query)) {
    return fetchOdooCatalogProductSearch({
      locale,
      page,
      per_page: perPage,
      q: query.q,
      world: query.world,
      category: query.category,
      subcategory: query.subcategory,
      brand: query.brand,
      tipologia: query.tipologia,
      ambiente: query.ambiente,
      stile: query.stile,
      attacco: query.attacco,
      wattaggio: query.wattaggio,
      wattaggio_min: query.wattaggio_min,
      wattaggio_max: query.wattaggio_max,
      color_temp: query.color_temp ?? query.colorTemp,
      tag: query.tag,
      sort: query.sort,
    })
  }

  const list = await fetchOdooCatalogProductList({
    locale,
    page,
    perPage,
  })

  if (!shouldEnrichSpecTags(query.enrich_spec_tags)) {
    return list
  }

  const items = await Promise.all(
    list.items.map(async (item) => {
      if (item.spec_tags?.length) return item
      try {
        const detail = await fetchOdooCatalogProductDetail(item.id, locale)
        const specTags = buildTechnicalCardSpecTagsFromSpecs(detail.product.specs ?? [])
        return specTags.length ? { ...item, spec_tags: specTags } : item
      } catch {
        return item
      }
    }),
  )

  return { ...list, items }
}

export async function proxyOdooCatalogProductSearch(query: {
  locale?: string
  lang?: string
  page?: string
  pageSize?: string
  per_page?: string
  q?: string
  category?: string
  subcategory?: string
  brand?: string
  world?: string
  tipologia?: string
  ambiente?: string
  stile?: string
  attacco?: string
  wattaggio?: string
  wattaggio_min?: string
  wattaggio_max?: string
  color_temp?: string
  colorTemp?: string
  tag?: string
  sort?: string
}) {
  const locale = langFromQuery(query.locale, query.lang)
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.per_page ?? query.pageSize) || 24))
  return fetchOdooCatalogProductSearch({
    locale,
    page,
    per_page: perPage,
    q: query.q,
    world: query.world,
    category: query.category,
    subcategory: query.subcategory,
    brand: query.brand,
    tipologia: query.tipologia,
    ambiente: query.ambiente,
    stile: query.stile,
    attacco: query.attacco,
    wattaggio: query.wattaggio,
    wattaggio_min: query.wattaggio_min,
    wattaggio_max: query.wattaggio_max,
    color_temp: query.color_temp ?? query.colorTemp,
    tag: query.tag,
    sort: query.sort,
  })
}

export async function proxyOdooCatalogFilters(query: {
  locale?: string
  lang?: string
  q?: string
  category?: string
  subcategory?: string
  brand?: string
  world?: string
  tipologia?: string
  ambiente?: string
  stile?: string
  attacco?: string
  wattaggio?: string
  wattaggio_min?: string
  wattaggio_max?: string
  color_temp?: string
  colorTemp?: string
  tag?: string
}) {
  const locale = langFromQuery(query.locale, query.lang)
  return fetchOdooCatalogFilters({
    locale,
    q: query.q,
    world: query.world,
    category: query.category,
    subcategory: query.subcategory,
    brand: query.brand,
    tipologia: query.tipologia,
    ambiente: query.ambiente,
    stile: query.stile,
    attacco: query.attacco,
    wattaggio: query.wattaggio,
    wattaggio_min: query.wattaggio_min,
    wattaggio_max: query.wattaggio_max,
    color_temp: query.color_temp ?? query.colorTemp,
    tag: query.tag,
  })
}

export async function proxyOdooCatalogProductDetail(
  productId: number,
  query: {
    locale?: string
    lang?: string
    partner_id?: string
    pricelist_id?: string
    website?: string
  },
) {
  const locale = langFromQuery(query.locale, query.lang)
  return fetchOdooCatalogProductDetail(productId, locale)
}

/**
 * BFF-only: resolve slug → id via search live Odoo, poi GET /api/v2/product/<id>.
 */
export async function proxyOdooCatalogProductBySlug(
  slug: string,
  query: {
    locale?: string
    lang?: string
    partner_id?: string
    pricelist_id?: string
    website?: string
  },
) {
  const locale = langFromQuery(query.locale, query.lang)
  const id = await findOdooCatalogProductIdBySlug(slug, locale)
  if (id == null) {
    throw new OdooCatalogClientError(`Prodotto non trovato per slug ${slug}`, 404)
  }
  return proxyOdooCatalogProductDetail(id, query)
}

export { OdooCatalogClientError }
