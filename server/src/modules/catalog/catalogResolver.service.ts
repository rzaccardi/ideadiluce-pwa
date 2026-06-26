import {
  fetchArflyProductBySlug,
  fetchArflyProductDetail,
  fetchArflyProductList,
  isArflyConfigured,
} from '../../adapters/arfly/arflyClient.js'
import { mapArflyProductDetail } from '../../adapters/arfly/arflyMapper.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import type { ProductDetailDTO } from '../../types/dto.js'
import { enrichProductDetailWithStock } from './catalog-stock.enrich.js'
import { enrichProductDetailWithOdooPricing } from './catalog-pricing.enrich.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'
import { parseOdooTemplateId } from './odooRef.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'

async function findProductIdBySlug(slug: string, locale: HubLocale): Promise<number | null> {
  const numeric = parseOdooTemplateId(slug)
  if (numeric != null) return numeric
  let page = 1
  while (page <= 20) {
    const list = await fetchArflyProductList({ locale, page, perPage: 100 })
    const hit = list.items.find((i) => i.slug === slug)
    if (hit) return hit.id
    if (page >= list.total_pages) break
    page += 1
  }
  return null
}

export async function resolveCatalogProduct(
  _ctx: OdooCallContext,
  productRef: string,
  locale: HubLocale = 'IT',
): Promise<ProductDetailDTO | null> {
  if (!isArflyConfigured()) return null

  try {
    const bySlug = await fetchArflyProductBySlug(productRef, locale)
    if (bySlug) return mapArflyProductDetail(bySlug.product, locale)
  } catch {
    // fallback sotto
  }

  const id = await findProductIdBySlug(productRef, locale)
  if (id == null) return null
  try {
    const res = await fetchArflyProductDetail(id, locale)
    return mapArflyProductDetail(res.product, locale)
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

export async function listArflyProductSlugs(locale: HubLocale = 'IT'): Promise<string[]> {
  if (!isArflyConfigured()) return []
  const slugs: string[] = []
  let page = 1
  while (page <= 50) {
    const list = await fetchArflyProductList({ locale, page, perPage: 100 })
    slugs.push(...list.items.map((i) => i.slug))
    if (page >= list.total_pages) break
    page += 1
  }
  return slugs
}
