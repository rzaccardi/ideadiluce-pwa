import type { Request, Response } from 'express'
import { ArflyClientError, toArflyError } from '../../adapters/arfly/arflyClient.js'
import { isArflyConfigured } from '../../adapters/arfly/arflyClient.js'
import { ok } from '../../lib/api-response.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'
import { AppError } from '../../types/errors.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { proxyArflyProductBySlug, proxyArflyProductDetail, proxyArflyProductList } from './arfly-proxy.service.js'

function assertArflyProxyEnabled() {
  if (!isArflyConfigured()) {
    throw new AppError(
      'ARFLY_NOT_CONFIGURED',
      'Arfly proxy not configured',
      'Catalogo non configurato sul server.',
      503,
      false,
    )
  }
}

function withArflyError(correlationId: string, run: () => Promise<void>) {
  return run().catch((e) => {
    if (e instanceof ArflyClientError) throw toArflyError(e, correlationId)
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

export const arflyProxyController = {
  products: asyncHandler(async (req: Request, res: Response) => {
    assertArflyProxyEnabled()
    await withArflyError(req.correlationId, async () => {
      const q = await pricingQueryFromRequest(req, {
        locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
        lang: typeof req.query.lang === 'string' ? req.query.lang : undefined,
        page: typeof req.query.page === 'string' ? req.query.page : undefined,
        pageSize: typeof req.query.pageSize === 'string' ? req.query.pageSize : undefined,
        per_page: typeof req.query.per_page === 'string' ? req.query.per_page : undefined,
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
        category: typeof req.query.category === 'string' ? req.query.category : undefined,
        brand: typeof req.query.brand === 'string' ? req.query.brand : undefined,
        partner_id: typeof req.query.partner_id === 'string' ? req.query.partner_id : undefined,
        pricelist_id: typeof req.query.pricelist_id === 'string' ? req.query.pricelist_id : undefined,
        website: typeof req.query.website === 'string' ? req.query.website : undefined,
      })
      const data = await proxyArflyProductList(q)
      res.json(ok(data))
    })
  }),

  productById: asyncHandler(async (req: Request, res: Response) => {
    assertArflyProxyEnabled()
    const productId = Number(req.params.productId)
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new AppError('VALIDATION_ERROR', 'Invalid product id', 'ID prodotto non valido.', 400, false)
    }
    await withArflyError(req.correlationId, async () => {
      const q = await pricingQueryFromRequest(req, {
        locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
        lang: typeof req.query.lang === 'string' ? req.query.lang : undefined,
        partner_id: typeof req.query.partner_id === 'string' ? req.query.partner_id : undefined,
        pricelist_id: typeof req.query.pricelist_id === 'string' ? req.query.pricelist_id : undefined,
        website: typeof req.query.website === 'string' ? req.query.website : undefined,
      })
      const data = await proxyArflyProductDetail(productId, q)
      res.json(ok(data))
    })
  }),

  productBySlug: asyncHandler(async (req: Request, res: Response) => {
    assertArflyProxyEnabled()
    const slug = typeof req.query.slug === 'string' ? req.query.slug.trim() : ''
    if (!slug) {
      throw new AppError('VALIDATION_ERROR', 'Missing slug', 'Slug prodotto mancante.', 400, false)
    }
    await withArflyError(req.correlationId, async () => {
      const q = await pricingQueryFromRequest(req, {
        locale: typeof req.query.locale === 'string' ? req.query.locale : undefined,
        lang: typeof req.query.lang === 'string' ? req.query.lang : undefined,
        partner_id: typeof req.query.partner_id === 'string' ? req.query.partner_id : undefined,
        pricelist_id: typeof req.query.pricelist_id === 'string' ? req.query.pricelist_id : undefined,
        website: typeof req.query.website === 'string' ? req.query.website : undefined,
      })
      const data = await proxyArflyProductBySlug(slug, q)
      res.json(ok(data))
    })
  }),
}
