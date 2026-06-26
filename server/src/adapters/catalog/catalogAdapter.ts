import type { HubLocale } from '../../lib/hub-locale.js'
import type { CategoryDTO, ProductCardDTO, ProductDetailDTO, ProductListDTO } from '../../types/dto.js'

export type CatalogContext = {
  correlationId: string
  locale?: HubLocale
}

export interface CatalogAdapter {
  getCategories(ctx: CatalogContext): Promise<CategoryDTO[]>
  getProducts(
    ctx: CatalogContext,
    filter?: { categorySlug?: string; q?: string },
    pagination?: { page: number; pageSize: number },
  ): Promise<ProductListDTO>
  getProductBySlug(ctx: CatalogContext, slug: string): Promise<ProductDetailDTO | null>
  getRecommendedProducts(
    ctx: CatalogContext,
    productSlugs: string[],
    options?: { limit?: number; strategy?: 'accessories' | 'category' },
  ): Promise<ProductCardDTO[]>
}
