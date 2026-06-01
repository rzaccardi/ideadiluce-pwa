import { createOdooCatalogAdapter } from '../../adapters/odoo/odooCatalogAdapter.js'
import type { CategoryDTO, ProductCardDTO, ProductDetailDTO, ProductListDTO } from '../../types/dto.js'

const adapter = createOdooCatalogAdapter()

function ctx(correlationId: string) {
  return { correlationId }
}

export const catalogRepository = {
  findCategories(correlationId: string): Promise<CategoryDTO[]> {
    return adapter.getCategories(ctx(correlationId))
  },
  findProducts(
    correlationId: string,
    options: { categorySlug?: string; q?: string; page: number; pageSize: number },
  ): Promise<ProductListDTO> {
    const filter = {
      ...(options.categorySlug ? { categorySlug: options.categorySlug } : {}),
      ...(options.q ? { q: options.q } : {}),
    }
    return adapter.getProducts(
      ctx(correlationId),
      Object.keys(filter).length > 0 ? filter : undefined,
      { page: options.page, pageSize: options.pageSize },
    )
  },
  findProductBySlug(correlationId: string, slug: string): Promise<ProductDetailDTO | null> {
    return adapter.getProductBySlug(ctx(correlationId), slug)
  },
  findRecommendedProducts(
    correlationId: string,
    productSlugs: string[],
    options?: { limit?: number },
  ): Promise<ProductCardDTO[]> {
    return adapter.getRecommendedProducts(ctx(correlationId), productSlugs, options)
  },
}
