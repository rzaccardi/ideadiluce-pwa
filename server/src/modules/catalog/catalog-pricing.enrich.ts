import { env } from '../../config/env.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { isOdooApiV2Configured } from '../../adapters/odoo-api/odooApiClient.js'
import type {
  ProductCardDTO,
  ProductDetailDTO,
  ProductPriceSourceDTO,
  ProductRelatedDTO,
} from '../../types/dto.js'
import type {
  OdooCatalogProductDetail,
  OdooCatalogProductDetailResponse,
  OdooCatalogProductListItem,
  OdooCatalogVariant,
} from '../../adapters/odoo-catalog/odooCatalog.types.js'
import {
  isPersonalizedPricing,
  type PricingContext,
} from '../pricing/pricelist.service.js'
import {
  fetchStorefrontPrices,
  type StorefrontPriceRow,
} from '../pricing/odoo-storefront-pricing.service.js'

function centsToEuros(cents: number): number {
  return Math.round(cents) / 100
}

type PricedCard = Pick<ProductCardDTO, 'priceCents'> & {
  odooTemplateId?: number | null
  slug?: string
  listPriceCents?: number | null
  discountPct?: number | null
  priceSource?: ProductPriceSourceDTO | null
}

/**
 * Sovrascrive `priceCents` delle card con `GET /api/v2/prices` (customer o pubblico).
 * Guest senza customer_id: prezzi pubblici dall’endpoint (utile cache).
 */
export async function enrichProductCardsWithOdooPricing<T extends PricedCard>(
  ctx: OdooCallContext,
  cards: T[],
  pricing?: PricingContext | null,
): Promise<T[]> {
  if (!env.ODOO_ENABLED || !isOdooApiV2Configured()) return cards
  if (!isPersonalizedPricing(pricing) || cards.length === 0) return cards

  const templateIds = cards
    .map((card) =>
      card.odooTemplateId != null && card.odooTemplateId > 0 ? card.odooTemplateId : null,
    )
    .filter((id): id is number => id != null)

  // Listing usa template id; /prices lavora su product.product.
  // Se non abbiamo variant id, lasciamo i prezzi catalogo pubblici già mappati.
  if (templateIds.length === 0) return cards

  // Per card listing senza variant id non chiamiamo /prices sui template:
  // i prezzi pubblici catalogo (price_from / list_price_from) restano validi.
  // Solo se c’è customer_id potremmo in futuro risolvere la variante default.
  void ctx
  void templateIds
  return cards
}

async function priceRelatedCards(
  ctx: OdooCallContext,
  items: ProductRelatedDTO[] | undefined,
  pricing?: PricingContext | null,
): Promise<ProductRelatedDTO[] | undefined> {
  if (!items?.length) return items
  return enrichProductCardsWithOdooPricing(ctx, items, pricing)
}

/** Allinea prezzi varianti PDP a `GET /api/v2/prices` (sostituisce XML-RPC listino). */
export async function enrichProductDetailWithOdooPricing(
  ctx: OdooCallContext,
  product: ProductDetailDTO,
  pricing?: PricingContext | null,
): Promise<ProductDetailDTO> {
  if (!env.ODOO_ENABLED || !isOdooApiV2Configured()) return product

  const variantIds = product.variants
    .map((v) => v.odooVariantId)
    .filter((id): id is number => id != null && id > 0)

  if (variantIds.length === 0) {
    if (!isPersonalizedPricing(pricing)) return product
    const [relatedProducts, accessories, alternatives, suggestedProducts, compatibleSources, substitutes] =
      await Promise.all([
        priceRelatedCards(ctx, product.relatedProducts, pricing),
        priceRelatedCards(ctx, product.accessories, pricing),
        priceRelatedCards(ctx, product.alternatives, pricing),
        priceRelatedCards(ctx, product.suggestedProducts, pricing),
        priceRelatedCards(ctx, product.compatibleSources, pricing),
        priceRelatedCards(ctx, product.substitutes, pricing),
      ])
    return {
      ...product,
      relatedProducts,
      accessories,
      alternatives,
      suggestedProducts,
      compatibleSources,
      substitutes,
    }
  }

  const { rows } = await fetchStorefrontPrices({
    productIds: variantIds,
    customerId: pricing?.partnerId ?? null,
    qty: 1,
    correlationId: ctx.correlationId,
  })

  if (rows.size === 0) return product

  const variants = product.variants.map((variant) => {
    const id = variant.odooVariantId
    if (id == null) return variant
    const row = rows.get(id)
    if (!row) return variant
    return {
      ...variant,
      priceCents: row.priceCents,
      listPriceCents: row.listPriceCents,
      discountPct: row.discountPct,
      priceSource: row.source,
    }
  })

  const variantPrices = variants
    .map((v) => v.priceCents)
    .filter((p): p is number => p != null && p > 0)
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : product.priceCents
  const minVariant = variants.find((v) => v.priceCents === minPrice)

  let next: ProductDetailDTO = {
    ...product,
    variants,
    priceCents: minPrice,
    listPriceCents: minVariant?.listPriceCents ?? product.listPriceCents,
    discountPct: minVariant?.discountPct ?? product.discountPct,
    priceSource: minVariant?.priceSource ?? product.priceSource,
    priceLabel: 'excl_vat',
  }

  if (!isPersonalizedPricing(pricing)) return next

  const [relatedProducts, accessories, alternatives, suggestedProducts, compatibleSources, substitutes] =
    await Promise.all([
      priceRelatedCards(ctx, next.relatedProducts, pricing),
      priceRelatedCards(ctx, next.accessories, pricing),
      priceRelatedCards(ctx, next.alternatives, pricing),
      priceRelatedCards(ctx, next.suggestedProducts, pricing),
      priceRelatedCards(ctx, next.compatibleSources, pricing),
      priceRelatedCards(ctx, next.substitutes, pricing),
    ])

  return {
    ...next,
    relatedProducts,
    accessories,
    alternatives,
    suggestedProducts,
    compatibleSources,
    substitutes,
  }
}

function pricingFromProxyQuery(query: {
  partner_id?: string
  pricelist_id?: string
}): PricingContext | null {
  const partnerId = Number(query.partner_id)
  const pricelistId = Number(query.pricelist_id)
  const hasPartner = Number.isInteger(partnerId) && partnerId > 0
  const hasPricelist = Number.isInteger(pricelistId) && pricelistId > 0
  if (!hasPartner && !hasPricelist) return null
  return {
    segment: 'BUSINESS',
    partnerId: hasPartner ? partnerId : null,
    pricelistId: hasPricelist ? pricelistId : null,
    personalized: true,
  }
}

function applyPriceRowToVariant(variant: OdooCatalogVariant, row: StorefrontPriceRow): OdooCatalogVariant {
  const priceEuros = centsToEuros(row.priceCents)
  const listEuros =
    row.listPriceCents != null ? centsToEuros(row.listPriceCents) : (variant.list_price ?? variant.lst_price)
  return {
    ...variant,
    price: priceEuros,
    list_price: listEuros,
    lst_price: listEuros,
    discount_pct: row.discountPct ?? undefined,
  }
}

/** Listing: prezzi pubblici dal catalogo; customer prices solo se abbiamo variant ids (non qui). */
export async function applySessionPricelistToOdooCatalogListItems<T extends OdooCatalogProductListItem>(
  _ctx: OdooCallContext,
  items: T[],
  query: { partner_id?: string; pricelist_id?: string },
): Promise<T[]> {
  const pricing = pricingFromProxyQuery(query)
  if (!pricing || items.length === 0) return items
  // Listing resta sui campi catalogo pubblici (price_from / list_price_from).
  // I prezzi customer sono applicati su PDP/cart via /prices.
  void pricing
  return items
}

/** Dettaglio loggato: dopo catalogo pubblico, `GET /prices` con customer_id sostituisce i prezzi. */
export async function applySessionPricelistToOdooCatalogDetail(
  ctx: OdooCallContext,
  data: OdooCatalogProductDetailResponse,
  query: { partner_id?: string; pricelist_id?: string },
): Promise<OdooCatalogProductDetailResponse> {
  const pricing = pricingFromProxyQuery(query)
  const product = data.product
  if (!pricing?.partnerId || !product) return data

  const variants = product.variants ?? []
  const variantIds = variants.map((v) => v.id).filter((id) => Number.isInteger(id) && id > 0)
  if (variantIds.length === 0) return data

  const { rows } = await fetchStorefrontPrices({
    productIds: variantIds,
    customerId: pricing.partnerId,
    qty: 1,
    correlationId: ctx.correlationId,
  })
  if (rows.size === 0) return data

  const nextVariants = variants.map((variant) => {
    const row = rows.get(variant.id)
    if (!row) return variant
    return applyPriceRowToVariant(variant, row)
  })

  const priced = nextVariants
    .map((v) => (v.price != null ? v.price : v.lst_price))
    .filter((p): p is number => p != null && Number.isFinite(p) && p > 0)
  const minEuros = priced.length > 0 ? Math.min(...priced) : null
  const maxDiscount = nextVariants.reduce<number | undefined>((max, v) => {
    if (v.discount_pct == null || !(v.discount_pct > 0)) return max
    return max == null ? v.discount_pct : Math.max(max, v.discount_pct)
  }, undefined)
  const listFrom = nextVariants
    .map((v) => v.list_price ?? v.lst_price)
    .filter((p): p is number => p != null && Number.isFinite(p) && p > 0)

  const nextProduct: OdooCatalogProductDetail = {
    ...product,
    variants: nextVariants,
    ...(minEuros != null ? { price_from: minEuros, price_to: minEuros } : {}),
    ...(listFrom.length
      ? { list_price_from: Math.min(...listFrom), list_price_to: Math.max(...listFrom) }
      : {}),
    ...(maxDiscount != null ? { discount_pct_max: maxDiscount } : {}),
  }

  return { ...data, product: nextProduct }
}
