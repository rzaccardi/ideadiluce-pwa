import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import type { CategoryDTO, ProductCardDTO, ProductDetailDTO, ProductListDTO } from '../../types/dto.js'
import type { OdooCallContext } from './odooClient.js'
import { isOdooConfigured } from './odooClient.js'
import { createMockOdooCatalogAdapter } from './odooCatalogMock.js'
import { createLiveOdooCatalogAdapter } from './odooCatalogLive.js'

export type { OdooCallContext }

export interface OdooCatalogAdapter {
  getCategories(ctx: OdooCallContext): Promise<CategoryDTO[]>
  getProducts(
    ctx: OdooCallContext,
    filter?: { categorySlug?: string; q?: string },
    pagination?: { page: number; pageSize: number },
  ): Promise<ProductListDTO>
  getProductBySlug(ctx: OdooCallContext, slug: string): Promise<ProductDetailDTO | null>
  getRecommendedProducts(
    ctx: OdooCallContext,
    productSlugs: string[],
    options?: { limit?: number },
  ): Promise<ProductCardDTO[]>
}

/**
 * Se `ODOO_ENABLED` e configurazione XML-RPC (Odoo 18) completa → catalogo Odoo, altrimenti mock locale.
 */
export function createOdooCatalogAdapter(): OdooCatalogAdapter {
  if (env.ODOO_ENABLED && !isOdooConfigured()) {
    logger.warn(
      'odoo.catalog: ODOO_ENABLED ma configurazione incompleta — uso catalogo mock',
    )
  }
  if (env.ODOO_ENABLED && isOdooConfigured()) {
    return createLiveOdooCatalogAdapter()
  }
  return createMockOdooCatalogAdapter()
}
