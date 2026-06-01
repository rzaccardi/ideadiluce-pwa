import { proxy } from 'valtio'
import type { CategoryDTO, ProductCardDTO } from '@/types/dto'

export type CatalogFilters = {
  categorySlug?: string
  q?: string
}

export const catalogStore = proxy({
  products: [] as ProductCardDTO[],
  categories: [] as CategoryDTO[],
  filters: { categorySlug: undefined, q: undefined } as CatalogFilters,
  pagination: {
    page: 1,
    pageSize: 24,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  isLoading: false,
  isLoadingMore: false,
  error: null as string | null,
})
