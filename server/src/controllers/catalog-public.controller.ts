import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { catalogStorefrontService } from '../modules/catalog/catalog-storefront.service.js'
import { getCatalogFiltersLive } from '../modules/catalog/catalog-odoo-search.service.js'
import {
  getOdooCatalogIndexMeta,
  syncOdooCatalogIndex,
} from '../modules/catalog/odoo-catalog-index.service.js'
import { enrichProductDetailWithStock } from '../modules/catalog/catalog-stock.enrich.js'
import { enrichProductDetailWithOdooPricing } from '../modules/catalog/catalog-pricing.enrich.js'
import { resolvePricingContext } from '../modules/pricing/pricelist.service.js'
import { siteService } from '../modules/site/site.service.js'
import { cartQuickReorderService } from '../modules/cart/cart-quick-reorder.service.js'
import { homeProductSlidersService } from '../modules/catalog/home-product-sliders.service.js'
import { HOME_PRODUCT_SLIDERS_CACHE_MAX_AGE_SEC } from '../modules/catalog/home-product-sliders.cache.js'
import type { ProductDetailDTO } from '../types/dto.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  resolveCatalogListPageSize,
  sanitizeCatalogSearchQuery,
} from '../modules/catalog/catalog-search-guard.js'
import { parseHubLocale } from '../lib/hub-locale.js'

function catalogFilterQueryFromRequest(req: Request) {
  const worldRaw = typeof req.query.world === 'string' ? req.query.world.trim() : undefined
  const world =
    worldRaw === 'design' || worldRaw === 'technical' ? worldRaw : undefined
  return {
    locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
    q: sanitizeCatalogSearchQuery(
      typeof req.query.q === 'string' ? req.query.q : undefined,
    ),
    world,
    categorySlug: typeof req.query.category === 'string' ? req.query.category : undefined,
    subcategorySlug:
      typeof req.query.subcategory === 'string' ? req.query.subcategory : undefined,
    brandSlug: typeof req.query.brand === 'string' ? req.query.brand : undefined,
    tipologia: typeof req.query.tipologia === 'string' ? req.query.tipologia : undefined,
    ambiente: typeof req.query.ambiente === 'string' ? req.query.ambiente : undefined,
    stile: typeof req.query.stile === 'string' ? req.query.stile : undefined,
    attacco: typeof req.query.attacco === 'string' ? req.query.attacco : undefined,
    wattaggio:
      typeof req.query.wattaggio === 'string' ? req.query.wattaggio : undefined,
    wattaggioMin:
      typeof req.query.wattaggio_min === 'string' ? req.query.wattaggio_min : undefined,
    wattaggioMax:
      typeof req.query.wattaggio_max === 'string' ? req.query.wattaggio_max : undefined,
    colorTemp:
      typeof req.query.colorTemp === 'string'
        ? req.query.colorTemp
        : typeof req.query.color_temp === 'string'
          ? req.query.color_temp
          : undefined,
    tag: typeof req.query.tag === 'string' ? req.query.tag : undefined,
  }
}

export const catalogPublicController = {
  bootstrap: asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const [categories, brands, cmsPage] = await Promise.all([
      catalogStorefrontService.listCategories(locale),
      catalogStorefrontService.listBrands(locale),
      siteService.getPublicPage('catalog', locale ?? 'IT'),
    ])
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    res.json(
      ok({
        categories,
        brands,
        cms: cmsPage.content,
      }),
    )
  }),

  categories: asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const items = await catalogStorefrontService.listCategories(locale)
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    res.json(ok({ items }))
  }),

  categoryBySlug: asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const item = await catalogStorefrontService.getCategoryBySlug(req.params.slug, locale)
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    res.json(ok({ item }))
  }),

  brands: asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const items = await catalogStorefrontService.listBrands(locale)
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    res.json(ok({ items }))
  }),

  brandBySlug: asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const item = await catalogStorefrontService.getBrandBySlug(req.params.slug, locale)
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    res.json(ok({ item }))
  }),

  products: asyncHandler(async (req: Request, res: Response) => {
    const pageRaw = typeof req.query.page === 'string' ? req.query.page : undefined
    const pageSizeRaw =
      typeof req.query.pageSize === 'string'
        ? req.query.pageSize
        : typeof req.query.per_page === 'string'
          ? req.query.per_page
          : undefined
    const filters = catalogFilterQueryFromRequest(req)
    const cacheOnly =
      req.query.cacheOnly === '1' ||
      req.query.cacheOnly === 'true' ||
      req.query.suggest === '1' ||
      req.query.suggest === 'true'
    const pageSize = resolveCatalogListPageSize(
      pageSizeRaw ? Number(pageSizeRaw) : undefined,
      Boolean(filters.q),
    )
    const sort =
      typeof req.query.sort === 'string' && req.query.sort.trim()
        ? req.query.sort.trim()
        : undefined
    const ctx = { correlationId: req.correlationId, req }
    const pricing = await resolvePricingContext(req)
    const data = await catalogStorefrontService.listProducts(ctx, {
      ...filters,
      page: pageRaw ? Number(pageRaw) : undefined,
      pageSize,
      sort,
      cacheOnly,
      partnerId: pricing.partnerId ?? undefined,
      pricelistId: pricing.pricelistId ?? undefined,
      pricing,
    })
    const source = cacheOnly ? 'proxy-cache' : 'odoo-search'
    if (pricing.partnerId == null && pricing.pricelistId == null) {
      res.set(
        'Cache-Control',
        cacheOnly
          ? 'public, s-maxage=60, stale-while-revalidate=300'
          : 'public, s-maxage=30, stale-while-revalidate=120',
      )
    } else {
      res.set('Cache-Control', 'private, no-store')
    }
    res.set('X-Catalog-Source', source)
    res.json(ok(data))
  }),

  /** Listing filtrato live (alias esplicito di /products senza cacheOnly). */
  search: asyncHandler(async (req: Request, res: Response) => {
    const pageRaw = typeof req.query.page === 'string' ? req.query.page : undefined
    const pageSizeRaw =
      typeof req.query.pageSize === 'string'
        ? req.query.pageSize
        : typeof req.query.per_page === 'string'
          ? req.query.per_page
          : undefined
    const filters = catalogFilterQueryFromRequest(req)
    const pageSize = resolveCatalogListPageSize(
      pageSizeRaw ? Number(pageSizeRaw) : undefined,
      Boolean(filters.q),
    )
    const sort =
      typeof req.query.sort === 'string' && req.query.sort.trim()
        ? req.query.sort.trim()
        : undefined
    const ctx = { correlationId: req.correlationId, req }
    const pricing = await resolvePricingContext(req)
    const data = await catalogStorefrontService.listProducts(ctx, {
      ...filters,
      page: pageRaw ? Number(pageRaw) : undefined,
      pageSize,
      sort,
      cacheOnly: false,
      partnerId: pricing.partnerId ?? undefined,
      pricelistId: pricing.pricelistId ?? undefined,
      pricing,
    })
    if (pricing.partnerId == null && pricing.pricelistId == null) {
      res.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120')
    } else {
      res.set('Cache-Control', 'private, no-store')
    }
    res.set('X-Catalog-Source', 'odoo-search')
    res.json(ok(data))
  }),

  /** Facet aggregate live da GET /api/v2/filters. */
  filters: asyncHandler(async (req: Request, res: Response) => {
    const filters = catalogFilterQueryFromRequest(req)
    const ctx = { correlationId: req.correlationId, req }
    const data = await getCatalogFiltersLive(ctx, filters)
    res.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120')
    res.set('X-Catalog-Source', 'odoo-filters')
    res.json(ok(data))
  }),

  enrichProductDetail: asyncHandler(async (req: Request, res: Response) => {
    const product = req.body as ProductDetailDTO
    const ctx = { correlationId: req.correlationId, req }
    const pricing = await resolvePricingContext(req)
    let enriched = await enrichProductDetailWithStock(ctx, product)
    enriched = await enrichProductDetailWithOdooPricing(ctx, enriched, pricing)
    res.json(ok(enriched))
  }),

  resolveCodes: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { text?: string; lines?: Array<{ code: string; quantity: number }>; locale?: string }
    const data = await cartQuickReorderService.resolveCodes(req, body)
    res.json(ok(data))
  }),

  homeProductSliders: asyncHandler(async (req: Request, res: Response) => {
    const ctx = { correlationId: req.correlationId, req }
    const pricing = await resolvePricingContext(req)
    const data = await homeProductSlidersService.list(ctx, {
      locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
      partnerId: pricing.partnerId ?? undefined,
      pricelistId: pricing.pricelistId ?? undefined,
    })
    if (pricing.partnerId == null && pricing.pricelistId == null) {
      res.setHeader(
        'Cache-Control',
        `public, max-age=${HOME_PRODUCT_SLIDERS_CACHE_MAX_AGE_SEC}, s-maxage=${HOME_PRODUCT_SLIDERS_CACHE_MAX_AGE_SEC}`,
      )
    } else {
      // Prezzi/listini partner non devono mai finire in cache condivise CDN/browser.
      res.setHeader('Cache-Control', 'private, no-store')
    }
    res.json(ok(data))
  }),

  /** Sync indice ricerca locale da API v2 (paginato 100/pagina). */
  syncCatalogIndex: asyncHandler(async (req: Request, res: Response) => {
    const locale = parseHubLocale(
      typeof req.query.locale === 'string' ? req.query.locale : undefined,
    )
    const result = await syncOdooCatalogIndex(locale)
    const meta = getOdooCatalogIndexMeta(locale)
    res.json(ok({ ...result, meta }))
  }),

  catalogIndexMeta: asyncHandler(async (req: Request, res: Response) => {
    const locale = parseHubLocale(
      typeof req.query.locale === 'string' ? req.query.locale : undefined,
    )
    res.json(ok(getOdooCatalogIndexMeta(locale)))
  }),
}
