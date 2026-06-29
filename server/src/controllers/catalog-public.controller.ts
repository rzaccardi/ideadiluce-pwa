import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { catalogStorefrontService } from '../modules/catalog/catalog-storefront.service.js'
import { enrichProductDetailWithStock } from '../modules/catalog/catalog-stock.enrich.js'
import { enrichProductDetailWithOdooPricing } from '../modules/catalog/catalog-pricing.enrich.js'
import { resolvePricingContext } from '../modules/pricing/pricelist.service.js'
import { siteService } from '../modules/site/site.service.js'
import { cartQuickReorderService } from '../modules/cart/cart-quick-reorder.service.js'
import type { ProductDetailDTO } from '../types/dto.js'
import { asyncHandler } from '../utils/async-handler.js'
import {
  resolveCatalogListPageSize,
  sanitizeCatalogSearchQuery,
} from '../modules/catalog/catalog-search-guard.js'

export const catalogPublicController = {
  bootstrap: asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const [categories, brands, cmsPage] = await Promise.all([
      catalogStorefrontService.listCategories(locale),
      catalogStorefrontService.listBrands(locale),
      siteService.getPublicPage('catalog', locale ?? 'IT'),
    ])
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
    res.json(ok({ items }))
  }),

  categoryBySlug: asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const item = await catalogStorefrontService.getCategoryBySlug(req.params.slug, locale)
    res.json(ok({ item }))
  }),

  brands: asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const items = await catalogStorefrontService.listBrands(locale)
    res.json(ok({ items }))
  }),

  brandBySlug: asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const item = await catalogStorefrontService.getBrandBySlug(req.params.slug, locale)
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
    const searchQ = sanitizeCatalogSearchQuery(
      typeof req.query.q === 'string' ? req.query.q : undefined,
    )
    const pageSize = resolveCatalogListPageSize(
      pageSizeRaw ? Number(pageSizeRaw) : undefined,
      Boolean(searchQ),
    )
    const ctx = { correlationId: req.correlationId, req }
    const pricing = await resolvePricingContext(req)
    const data = await catalogStorefrontService.listProducts(ctx, {
      locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
      page: pageRaw ? Number(pageRaw) : undefined,
      pageSize,
      q: searchQ,
      categorySlug: typeof req.query.category === 'string' ? req.query.category : undefined,
      brandSlug: typeof req.query.brand === 'string' ? req.query.brand : undefined,
      partnerId: pricing.partnerId ?? undefined,
      pricelistId: pricing.pricelistId ?? undefined,
    })
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
}
