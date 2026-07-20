import { api } from '@/api/endpoints'
import { findOdooCatalogProductIdBySlug, toPwaLocale } from '@/lib/odoo-catalog/lookup'
import { mapOdooCatalogProductDetail } from '@/lib/odoo-catalog/mapper'
import type { PwaLocale } from '@/lib/locale'
import type { ProductDetailDTO } from '@/types/dto'
import { ApiRequestError } from '@/types/api'

export type CatalogPricingOptions = {
  partnerId?: number
  pricelistId?: number
}

/**
 * Pipeline unificata PDP: OdooCatalog by-slug → map DTO → enrich stock Odoo (BFF).
 * Usata da CSR; SSR usa la stessa sequenza via server-catalog + cookie forward.
 */
export async function loadProductDetailPipeline(
  slug: string,
  locale: PwaLocale,
  pricing: CatalogPricingOptions = {},
): Promise<ProductDetailDTO> {
  let res: Awaited<ReturnType<typeof api.odooCatalog.productBySlug>> | null = null
  try {
    res = await api.odooCatalog.productBySlug(slug, locale, pricing)
  } catch (e) {
    if (!(e instanceof ApiRequestError && e.status === 404)) throw e
  }

  if (!res?.product) {
    const productId = await findOdooCatalogProductIdBySlug(slug, locale, pricing)
    if (productId == null) {
      throw new ApiRequestError(
        'PRODUCT_NOT_FOUND',
        'Not found',
        404,
        undefined,
        'Prodotto non più disponibile.',
      )
    }
    res = await api.odooCatalog.product(productId, locale, pricing)
  }

  let product = mapOdooCatalogProductDetail(res.product, locale)
  try {
    product = await api.catalog.enrichProductDetail(product)
  } catch {
    // Mantieni dati OdooCatalog se arricchimento non disponibile
  }
  return product
}

export function toPipelineLocale(locale: string): PwaLocale {
  return toPwaLocale(locale)
}
