import { env } from '../../config/env.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { ProductDetailDTO } from '../../types/dto.js'
import type { PricingContext } from '../pricing/pricelist.service.js'
import { unitPriceCentsFromOdoo } from './odooPricing.service.js'

function productRefForPricing(product: ProductDetailDTO): string {
  if (product.slug?.trim()) return product.slug.trim()
  if (product.odooTemplateId != null) return String(product.odooTemplateId)
  return ''
}

/** Allinea prezzi varianti/template al listino Odoo (master post-carrello). */
export async function enrichProductDetailWithOdooPricing(
  ctx: OdooCallContext,
  product: ProductDetailDTO,
  pricing?: PricingContext | null,
): Promise<ProductDetailDTO> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return product

  const productRef = productRefForPricing(product)
  if (!productRef) return product

  if (product.variants.length === 0) {
    const cents = await unitPriceCentsFromOdoo(ctx, productRef, null, pricing)
    if (cents == null || cents <= 0) return product
    return { ...product, priceCents: cents, priceLabel: 'excl_vat' }
  }

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

  return {
    ...product,
    variants,
    priceCents: minPrice,
    priceLabel: 'excl_vat',
  }
}
