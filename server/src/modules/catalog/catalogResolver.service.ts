import {
  fetchOdooCatalogProductDetail,
  fetchOdooCatalogProductList,
  isOdooCatalogConfigured,
} from '../../adapters/odoo-catalog/odooCatalogClient.js'
import { findOdooCatalogProductIdBySlug } from '../../adapters/odoo-catalog/odooCatalogSlugIndex.js'
import { mapOdooCatalogProductDetail } from '../../adapters/odoo-catalog/odooCatalogMapper.js'
import { env } from '../../config/env.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import type { ProductDetailDTO } from '../../types/dto.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { enrichProductDetailWithStock } from './catalog-stock.enrich.js'
import { enrichProductDetailWithOdooPricing } from './catalog-pricing.enrich.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'
import { listOdooStorefrontProductSlugs } from './odoo-catalog-search.service.js'
import { parseOdooTemplateId } from './odooRef.js'

export async function resolveCatalogProduct(
  _ctx: OdooCallContext,
  productRef: string,
  locale: HubLocale = 'IT',
): Promise<ProductDetailDTO | null> {
  if (!isOdooCatalogConfigured()) return null

  const asId = parseOdooTemplateId(productRef)
  if (asId != null) {
    try {
      const res = await fetchOdooCatalogProductDetail(asId, locale)
      return mapOdooCatalogProductDetail(res.product, locale)
    } catch {
      return null
    }
  }

  const id = await findOdooCatalogProductIdBySlug(productRef, locale)
  if (id == null) return null
  try {
    const res = await fetchOdooCatalogProductDetail(id, locale)
    return mapOdooCatalogProductDetail(res.product, locale)
  } catch {
    return null
  }
}

/** Prodotto catalogo con stock/availability e prezzi Odoo arricchiti (carrello, checkout, restock). */
export async function resolveCatalogProductEnriched(
  ctx: OdooCallContext,
  productRef: string,
  locale: HubLocale = 'IT',
  requestedQty = 1,
): Promise<ProductDetailDTO | null> {
  const product = await resolveCatalogProduct(ctx, productRef, locale)
  if (!product) return null
  let enriched = await enrichProductDetailWithStock(ctx, product, requestedQty)
  const pricing = ctx.req ? await resolvePricingContext(ctx.req) : null
  enriched = await enrichProductDetailWithOdooPricing(ctx, enriched, pricing)
  return enriched
}

export async function listOdooCatalogProductSlugs(
  locale: HubLocale = 'IT',
  ctx: OdooCallContext = { correlationId: 'catalog-slugs' },
): Promise<string[]> {
  if (env.ODOO_ENABLED && isOdooConfigured()) {
    return listOdooStorefrontProductSlugs(ctx)
  }

  if (!isOdooCatalogConfigured()) return []

  const slugs: string[] = []
  let page = 1
  while (page <= 50) {
    const list = await fetchOdooCatalogProductList({ locale, page, perPage: 100 })
    slugs.push(...list.items.map((i) => i.slug))
    if (page >= list.total_pages) break
    page += 1
  }
  return slugs
}
