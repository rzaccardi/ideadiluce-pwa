import { env } from '../../config/env.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { ProductCardDTO, ProductDetailDTO, ProductRelatedDTO } from '../../types/dto.js'
import type {
  OdooCatalogProductDetail,
  OdooCatalogProductDetailResponse,
  OdooCatalogProductListItem,
} from '../../adapters/odoo-catalog/odooCatalog.types.js'
import {
  isPersonalizedPricing,
  type PricingContext,
} from '../pricing/pricelist.service.js'
import { resolveCartLineUnitPricesCents, unitPriceCentsFromOdoo } from './odooPricing.service.js'

function productRefForPricing(product: ProductDetailDTO): string {
  if (product.odooTemplateId != null && product.odooTemplateId > 0) {
    return String(product.odooTemplateId)
  }
  if (product.slug?.trim()) return product.slug.trim()
  return ''
}

function centsToEuros(cents: number): number {
  return Math.round(cents) / 100
}

type PricedCard = Pick<ProductCardDTO, 'priceCents'> & {
  odooTemplateId?: number | null
  slug?: string
}

/** Sovrascrive `priceCents` delle card col listino sessione (batch XML-RPC). Guest invariato. */
export async function enrichProductCardsWithOdooPricing<T extends PricedCard>(
  ctx: OdooCallContext,
  cards: T[],
  pricing?: PricingContext | null,
): Promise<T[]> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return cards
  if (!isPersonalizedPricing(pricing) || cards.length === 0) return cards

  const lines = cards.map((card, index) => ({
    lineId: String(index),
    productRef:
      card.odooTemplateId != null && card.odooTemplateId > 0
        ? String(card.odooTemplateId)
        : (card.slug ?? ''),
    variantRef: null,
  }))

  let prices: Map<string, number | null>
  try {
    prices = await resolveCartLineUnitPricesCents(ctx, lines, pricing)
  } catch {
    return cards
  }

  return cards.map((card, index) => {
    const cents = prices.get(String(index))
    if (cents == null || cents <= 0) return card
    return { ...card, priceCents: cents }
  })
}

async function priceRelatedCards(
  ctx: OdooCallContext,
  items: ProductRelatedDTO[] | undefined,
  pricing?: PricingContext | null,
): Promise<ProductRelatedDTO[] | undefined> {
  if (!items?.length) return items
  return enrichProductCardsWithOdooPricing(ctx, items, pricing)
}

/** Allinea prezzi varianti/template al listino Odoo (master post-carrello). */
export async function enrichProductDetailWithOdooPricing(
  ctx: OdooCallContext,
  product: ProductDetailDTO,
  pricing?: PricingContext | null,
): Promise<ProductDetailDTO> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return product

  const productRef = productRefForPricing(product)
  let next = product

  if (productRef) {
    if (product.variants.length === 0) {
      const cents = await unitPriceCentsFromOdoo(ctx, productRef, null, pricing)
      if (cents != null && cents > 0) {
        next = { ...product, priceCents: cents, priceLabel: 'excl_vat' }
      }
    } else {
      const variants = await Promise.all(
        product.variants.map(async (variant) => {
          const cents = await unitPriceCentsFromOdoo(ctx, productRef, variant.ref, pricing)
          if (cents == null || cents <= 0) return variant
          return { ...variant, priceCents: cents }
        }),
      )

      const variantPrices = variants
        .map((v) => v.priceCents)
        .filter((p): p is number => p != null && p > 0)
      const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : product.priceCents

      next = {
        ...product,
        variants,
        priceCents: minPrice,
        priceLabel: 'excl_vat',
      }
    }
  }

  if (!isPersonalizedPricing(pricing)) return next

  const [relatedProducts, accessories, alternatives] = await Promise.all([
    priceRelatedCards(ctx, next.relatedProducts, pricing),
    priceRelatedCards(ctx, next.accessories, pricing),
    priceRelatedCards(ctx, next.alternatives, pricing),
  ])

  return {
    ...next,
    relatedProducts,
    accessories,
    alternatives,
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

export async function applySessionPricelistToOdooCatalogListItems<T extends OdooCatalogProductListItem>(
  ctx: OdooCallContext,
  items: T[],
  query: { partner_id?: string; pricelist_id?: string },
): Promise<T[]> {
  const pricing = pricingFromProxyQuery(query)
  if (!pricing || items.length === 0) return items

  const lines = items.map((item, index) => ({
    lineId: String(index),
    productRef: String(item.id),
    variantRef: null,
  }))

  let prices: Map<string, number | null>
  try {
    prices = await resolveCartLineUnitPricesCents(ctx, lines, pricing)
  } catch {
    return items
  }

  return items.map((item, index) => {
    const cents = prices.get(String(index))
    if (cents == null || cents <= 0) return item
    const euros = centsToEuros(cents)
    return { ...item, price_from: euros, price_to: euros }
  })
}

export async function applySessionPricelistToOdooCatalogDetail(
  ctx: OdooCallContext,
  data: OdooCatalogProductDetailResponse,
  query: { partner_id?: string; pricelist_id?: string },
): Promise<OdooCatalogProductDetailResponse> {
  const pricing = pricingFromProxyQuery(query)
  const product = data.product
  if (!pricing || !product) return data

  const variants = product.variants ?? []
  const lines =
    variants.length > 0
      ? variants.map((variant, index) => ({
          lineId: String(index),
          productRef: String(product.id),
          variantRef: String(variant.id),
        }))
      : [{ lineId: '0', productRef: String(product.id), variantRef: null }]

  let prices: Map<string, number | null>
  try {
    prices = await resolveCartLineUnitPricesCents(ctx, lines, pricing)
  } catch {
    return data
  }

  const nextVariants =
    variants.length > 0
      ? variants.map((variant, index) => {
          const cents = prices.get(String(index))
          if (cents == null || cents <= 0) return variant
          return { ...variant, lst_price: centsToEuros(cents) }
        })
      : variants

  const priced = [...prices.values()].filter((cents): cents is number => cents != null && cents > 0)
  const minCents = priced.length > 0 ? Math.min(...priced) : null
  const nextProduct: OdooCatalogProductDetail = {
    ...product,
    variants: nextVariants,
    ...(minCents != null
      ? { price_from: centsToEuros(minCents), price_to: centsToEuros(minCents) }
      : {}),
  }

  return { ...data, product: nextProduct }
}
