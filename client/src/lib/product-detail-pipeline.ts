import { api } from '@/api/endpoints'
import { findArflyProductIdBySlug, toPwaLocale } from '@/lib/arfly/lookup'
import { mapArflyProductDetail } from '@/lib/arfly/mapper'
import type { PwaLocale } from '@/lib/locale'
import type { ProductDetailDTO } from '@/types/dto'
import { ApiRequestError } from '@/types/api'

export type CatalogPricingOptions = {
  partnerId?: number
  pricelistId?: number
}

/**
 * Pipeline unificata PDP: Arfly by-slug → map DTO → enrich stock Odoo (BFF).
 * Usata da CSR; SSR usa la stessa sequenza via server-catalog + cookie forward.
 */
export async function loadProductDetailPipeline(
  slug: string,
  locale: PwaLocale,
  pricing: CatalogPricingOptions = {},
): Promise<ProductDetailDTO> {
  let res: Awaited<ReturnType<typeof api.arfly.productBySlug>> | null = null
  try {
    res = await api.arfly.productBySlug(slug, locale, pricing)
  } catch (e) {
    if (!(e instanceof ApiRequestError && e.status === 404)) throw e
  }

  if (!res?.product) {
    const productId = await findArflyProductIdBySlug(slug, locale, pricing)
    if (productId == null) {
      throw new ApiRequestError('PRODUCT_NOT_FOUND', 'Not found', 404, undefined, 'Prodotto non trovato.')
    }
    res = await api.arfly.product(productId, locale, pricing)
  }

  let product = mapArflyProductDetail(res.product, locale)
  try {
    product = await api.catalog.enrichProductDetail(product)
  } catch {
    // Mantieni dati Arfly se arricchimento non disponibile
  }
  return product
}

export function toPipelineLocale(locale: string): PwaLocale {
  return toPwaLocale(locale)
}
