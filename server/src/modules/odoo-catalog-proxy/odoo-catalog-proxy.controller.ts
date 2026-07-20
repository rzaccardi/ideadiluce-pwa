import type { Request, Response } from 'express'
import { OdooCatalogClientError, toOdooCatalogError } from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { isOdooCatalogConfigured } from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { ok } from '../../lib/api-response.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'
import { AppError } from '../../types/errors.js'
import { asyncHandler } from '../../utils/async-handler.js'
import {
  proxyOdooCatalogFilters,
  proxyOdooCatalogProductBySlug,
  proxyOdooCatalogProductDetail,
  proxyOdooCatalogProductList,
  proxyOdooCatalogProductSearch,
} from './odoo-catalog-proxy.service.js'

function assertOdooCatalogProxyEnabled() {
  if (!isOdooCatalogConfigured()) {
    throw new AppError(
      'ODOO_CATALOG_NOT_CONFIGURED',
      'OdooCatalog proxy not configured',
      'Catalogo non configurato sul server.',
      503,
      false,
    )
  }
}

function withOdooCatalogError(correlationId: string, run: () => Promise<void>) {
  return run().catch((e) => {
    if (e instanceof OdooCatalogClientError) throw toOdooCatalogError(e, correlationId)
    throw e
  })
}

async function pricingQueryFromRequest(
  req: Request,
  query: Record<string, string | undefined>,
): Promise<Record<string, string | undefined>> {
  if (query.partner_id || query.pricelist_id) return query
  const pricing = await resolvePricingContext(req)
  const merged = { ...query }
  if (pricing.partnerId != null) merged.partner_id = String(pricing.partnerId)
  if (pricing.pricelistId != null) merged.pricelist_id = String(pricing.pricelistId)
  return merged
}

function catalogFilterQuery(req: Request): Record<string, string | undefined> {
  return {
    locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
    lang: typeof req.query.lang === 'string' ? req.query.lang : undefined,
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    subcategory: typeof req.query.subcategory === 'string' ? req.query.subcategory : undefined,
    brand: typeof req.query.brand === 'string' ? req.query.brand : undefined,
    world: typeof req.query.world === 'string' ? req.query.world : undefined,
    tipologia: typeof req.query.tipologia === 'string' ? req.query.tipologia : undefined,
    ambiente: typeof req.query.ambiente === 'string' ? req.query.ambiente : undefined,
    stile: typeof req.query.stile === 'string' ? req.query.stile : undefined,
    attacco: typeof req.query.attacco === 'string' ? req.query.attacco : undefined,
    wattaggio: typeof req.query.wattaggio === 'string' ? req.query.wattaggio : undefined,
    wattaggio_min:
      typeof req.query.wattaggio_min === 'string' ? req.query.wattaggio_min : undefined,
    wattaggio_max:
      typeof req.query.wattaggio_max === 'string' ? req.query.wattaggio_max : undefined,
    color_temp:
      typeof req.query.color_temp === 'string'
        ? req.query.color_temp
        : typeof req.query.colorTemp === 'string'
          ? req.query.colorTemp
          : undefined,
    colorTemp: typeof req.query.colorTemp === 'string' ? req.query.colorTemp : undefined,
    tag: typeof req.query.tag === 'string' ? req.query.tag : undefined,
    sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
  }
}

export const odooCatalogProxyController = {
  products: asyncHandler(async (req: Request, res: Response) => {
    assertOdooCatalogProxyEnabled()
    await withOdooCatalogError(req.correlationId, async () => {
      const q = await pricingQueryFromRequest(req, {
        ...catalogFilterQuery(req),
        page: typeof req.query.page === 'string' ? req.query.page : undefined,
        pageSize: typeof req.query.pageSize === 'string' ? req.query.pageSize : undefined,
        per_page: typeof req.query.per_page === 'string' ? req.query.per_page : undefined,
        partner_id: typeof req.query.partner_id === 'string' ? req.query.partner_id : undefined,
        pricelist_id:
          typeof req.query.pricelist_id === 'string' ? req.query.pricelist_id : undefined,
        website: typeof req.query.website === 'string' ? req.query.website : undefined,
        enrich_spec_tags:
          typeof req.query.enrich_spec_tags === 'string' ? req.query.enrich_spec_tags : undefined,
      })
      const data = await proxyOdooCatalogProductList(q)
      res.json(ok(data))
    })
  }),

  productsSearch: asyncHandler(async (req: Request, res: Response) => {
    assertOdooCatalogProxyEnabled()
    await withOdooCatalogError(req.correlationId, async () => {
      const data = await proxyOdooCatalogProductSearch({
        ...catalogFilterQuery(req),
        page: typeof req.query.page === 'string' ? req.query.page : undefined,
        pageSize: typeof req.query.pageSize === 'string' ? req.query.pageSize : undefined,
        per_page: typeof req.query.per_page === 'string' ? req.query.per_page : undefined,
      })
      res.json(ok(data))
    })
  }),

  filters: asyncHandler(async (req: Request, res: Response) => {
    assertOdooCatalogProxyEnabled()
    await withOdooCatalogError(req.correlationId, async () => {
      const data = await proxyOdooCatalogFilters(catalogFilterQuery(req))
      res.json(ok(data))
    })
  }),

  productById: asyncHandler(async (req: Request, res: Response) => {
    assertOdooCatalogProxyEnabled()
    const productId = Number(req.params.productId)
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new AppError('VALIDATION_ERROR', 'Invalid product id', 'ID prodotto non valido.', 400, false)
    }
    await withOdooCatalogError(req.correlationId, async () => {
      const q = await pricingQueryFromRequest(req, {
        locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
        lang: typeof req.query.lang === 'string' ? req.query.lang : undefined,
        partner_id: typeof req.query.partner_id === 'string' ? req.query.partner_id : undefined,
        pricelist_id: typeof req.query.pricelist_id === 'string' ? req.query.pricelist_id : undefined,
        website: typeof req.query.website === 'string' ? req.query.website : undefined,
      })
      const data = await proxyOdooCatalogProductDetail(productId, q)
      res.json(ok(data))
    })
  }),

  productBySlug: asyncHandler(async (req: Request, res: Response) => {
    assertOdooCatalogProxyEnabled()
    const slug = typeof req.query.slug === 'string' ? req.query.slug.trim() : ''
    if (!slug) {
      throw new AppError('VALIDATION_ERROR', 'Missing slug', 'Slug prodotto mancante.', 400, false)
    }
    await withOdooCatalogError(req.correlationId, async () => {
      const q = await pricingQueryFromRequest(req, {
        locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
        lang: typeof req.query.lang === 'string' ? req.query.lang : undefined,
        partner_id: typeof req.query.partner_id === 'string' ? req.query.partner_id : undefined,
        pricelist_id: typeof req.query.pricelist_id === 'string' ? req.query.pricelist_id : undefined,
        website: typeof req.query.website === 'string' ? req.query.website : undefined,
      })
      const data = await proxyOdooCatalogProductBySlug(slug, q)
      res.json(ok(data))
    })
  }),
}
