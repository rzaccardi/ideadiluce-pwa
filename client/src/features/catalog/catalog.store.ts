import { proxy } from 'valtio'
import type { CategoryDTO, ProductCardDTO } from '@/types/dto'
import type { BrandListItemDTO } from '@/types/site-content'

export type CatalogSort = 'relevance' | 'price_asc' | 'price_desc' | 'name_asc'

export type CatalogFilters = {
  categorySlug?: string
  brandSlug?: string
  q?: string
  locale: string
  inStockOnly?: boolean
  minPriceCents?: number
  maxPriceCents?: number
  sort?: CatalogSort
  attacco?: string
  colorTemp?: string
  world?: 'design' | 'technical'
}

export const catalogStore = proxy({
  /** Prodotti grezzi dall'API, prima dei filtri client-side. */
  rawProducts: [] as ProductCardDTO[],
  products: [] as ProductCardDTO[],
  /** Chiave dell'ultimo fetch server (q, categoria, brand, pagina, locale). */
  serverFetchKey: null as string | null,
  categories: [] as CategoryDTO[],
  brands: [] as BrandListItemDTO[],
  filters: {
    categorySlug: undefined,
    q: undefined,
    locale: 'IT',
    inStockOnly: false,
    sort: 'relevance' as CatalogSort,
  } as CatalogFilters,
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
