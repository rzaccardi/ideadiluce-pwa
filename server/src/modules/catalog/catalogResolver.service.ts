import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { ProductDetailDTO } from '../../types/dto.js'
import { env } from '../../config/env.js'
import { hubCatalogRepository } from '../hub-catalog/hub-catalog.repository.js'
import { composeHubProduct } from './catalogComposer.service.js'
import { catalogRepository } from './catalog.repository.js'

async function useHubCatalog(): Promise<boolean> {
  if (!env.HUB_CATALOG_ENABLED) return false
  try {
    return await hubCatalogRepository.hasCatalog()
  } catch {
    return false
  }
}

export async function resolveCatalogProduct(
  ctx: OdooCallContext,
  productRef: string,
): Promise<ProductDetailDTO | null> {
  if (await useHubCatalog()) {
    const hub = await hubCatalogRepository.findProductByCartRef(productRef)
    if (!hub) return null
    return composeHubProduct(ctx, hub)
  }
  return catalogRepository.findProductBySlug(ctx.correlationId, productRef)
}
