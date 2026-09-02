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
import {
  getCachedProductDetailById,
  getCachedProductDetailBySlug,
} from './odoo-catalog-index.service.js'
import { markCatalogDegraded } from '../odoo/odoo-degraded-state.js'
import { isCatalogCacheFallbackEnabled } from '../odoo/odoo-resilience.settings.js'

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
      return getCachedDetail(locale, asId, null)
    }
  }

  let id: number | null = null
  try {
    id = await findOdooCatalogProductIdBySlug(productRef, locale)
  } catch {
    return getCachedDetail(locale, null, productRef)
  }
  if (id != null) {
    try {
      const res = await fetchOdooCatalogProductDetail(id, locale)
      return mapOdooCatalogProductDetail(res.product, locale)
    } catch {
      return getCachedDetail(locale, id, productRef)
    }
  }

  return getCachedDetail(locale, null, productRef)
}

async function getCachedDetail(
  locale: HubLocale,
  id: number | null,
  slug: string | null,
): Promise<ProductDetailDTO | null> {
  markCatalogDegraded()
  if (!(await isCatalogCacheFallbackEnabled())) return null
  const raw =
    (id != null ? await getCachedProductDetailById(locale, id) : null) ??
    (slug ? await getCachedProductDetailBySlug(locale, slug) : null)
  if (!raw?.product) return null
  return { ...mapOdooCatalogProductDetail(raw.product, locale), degraded: true }
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
