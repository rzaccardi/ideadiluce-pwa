import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { catalogStorefrontService } from '../modules/catalog/catalog-storefront.service.js'
import { enrichProductDetailWithStock } from '../modules/catalog/catalog-stock.enrich.js'
import { enrichProductDetailWithOdooPricing } from '../modules/catalog/catalog-pricing.enrich.js'
import { resolvePricingContext } from '../modules/pricing/pricelist.service.js'
import type { ProductDetailDTO } from '../types/dto.js'
import { asyncHandler } from '../utils/async-handler.js'

export const catalogPublicController = {
  categories: asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const items = await catalogStorefrontService.listCategories(locale)
    res.json(ok({ items }))
  }),

  brands: asyncHandler(async (req: Request, res: Response) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const items = await catalogStorefrontService.listBrands(locale)
    res.json(ok({ items }))
  }),

  products: asyncHandler(async (req: Request, res: Response) => {
    const pageRaw = typeof req.query.page === 'string' ? req.query.page : undefined
    const pageSizeRaw =
      typeof req.query.pageSize === 'string'
        ? req.query.pageSize
        : typeof req.query.per_page === 'string'
          ? req.query.per_page
          : undefined
    const ctx = { correlationId: req.correlationId, req }
    const pricing = await resolvePricingContext(req)
    const data = await catalogStorefrontService.listProducts(ctx, {
      locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
      page: pageRaw ? Number(pageRaw) : undefined,
      pageSize: pageSizeRaw ? Number(pageSizeRaw) : undefined,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
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
}
