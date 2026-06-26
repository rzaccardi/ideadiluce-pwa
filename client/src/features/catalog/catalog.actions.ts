import { api } from '@/api/endpoints'
import { dedupeAsync } from '@/lib/async-cache'
import { isCatalogProductPurchasable } from '@/lib/product-availability'
import type { PwaLocale } from '@/lib/locale'
import type { ProductCardDTO } from '@/types/dto'
import type { CatalogSort } from './catalog.store'
import { ApiRequestError } from '@/types/api'
import { catalogStore } from './catalog.store'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore catalogo'
}

function applyClientFilters(
  products: ProductCardDTO[],
  filters: {
    inStockOnly?: boolean
    minPriceCents?: number
    maxPriceCents?: number
    sort?: CatalogSort
    locale?: string
  },
) {
  let list = [...products]
  if (filters.minPriceCents != null) {
    list = list.filter((p) => p.priceCents >= filters.minPriceCents!)
  }
  if (filters.maxPriceCents != null) {
    list = list.filter((p) => p.priceCents <= filters.maxPriceCents!)
  }
  if (filters.inStockOnly) {
    list = list.filter((p) =>
      isCatalogProductPurchasable(p, (filters.locale ?? 'IT') as PwaLocale),
    )
  }
  switch (filters.sort) {
    case 'price_asc':
      list.sort((a, b) => a.priceCents - b.priceCents)
      break
    case 'price_desc':
      list.sort((a, b) => b.priceCents - a.priceCents)
      break
    case 'name_asc':
      list.sort((a, b) => a.name.localeCompare(b.name, 'it'))
      break
    default:
      break
  }
  return list
}

function productsRequestKey(filters: {
  q?: string
  categorySlug?: string
  brandSlug?: string
  page: number
  pageSize: number
  locale: string
}) {
  return [
    filters.q ?? '',
    filters.categorySlug ?? '',
    filters.brandSlug ?? '',
    filters.page,
    filters.pageSize,
    filters.locale,
  ].join('|')
}

export function fetchCategories(options?: { force?: boolean; locale?: string }) {
  const locale = options?.locale ?? catalogStore.filters.locale
  return dedupeAsync(`catalog:categories:${locale}`, async () => {
    try {
      const data = await api.catalog.categories(locale)
      catalogStore.categories = data.items
    } catch {
      catalogStore.categories = []
    }
  })
}

export function fetchBrands(options?: { force?: boolean; locale?: string }) {
  const locale = options?.locale ?? catalogStore.filters.locale
  return dedupeAsync(`catalog:brands:${locale}`, async () => {
    try {
      const data = await api.catalog.brands(locale)
      catalogStore.brands = data.items
    } catch {
      catalogStore.brands = []
    }
  })
}

async function loadProducts(filters: {
  q?: string
  categorySlug?: string
  brandSlug?: string
  page: number
  pageSize: number
  locale: string
  inStockOnly?: boolean
  minPriceCents?: number
  maxPriceCents?: number
  sort?: CatalogSort
}) {
  catalogStore.isLoading = true
  catalogStore.error = null
  try {
    const result = await api.catalog.products({
      q: filters.q,
      category: filters.categorySlug,
      brand: filters.brandSlug,
      page: filters.page,
      pageSize: filters.pageSize,
      locale: filters.locale,
    })
    catalogStore.products = applyClientFilters(result.items, filters)
    catalogStore.pagination = {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    }
  } catch (e) {
    catalogStore.error = errMessage(e)
  } finally {
    catalogStore.isLoading = false
  }
}

export function fetchProducts(partialFilters?: {
  categorySlug?: string
  brandSlug?: string
  q?: string
  page?: number
  pageSize?: number
  locale?: string
  inStockOnly?: boolean
  minPriceCents?: number
  maxPriceCents?: number
  sort?: CatalogSort
}) {
  if (partialFilters && 'categorySlug' in partialFilters) {
    catalogStore.filters.categorySlug = partialFilters.categorySlug
  }
  if (partialFilters && 'brandSlug' in partialFilters) {
    catalogStore.filters.brandSlug = partialFilters.brandSlug
  }
  if (partialFilters && 'q' in partialFilters) {
    catalogStore.filters.q = partialFilters.q
  }
  if (partialFilters?.locale) {
    catalogStore.filters.locale = partialFilters.locale
  }
  if (partialFilters && 'inStockOnly' in partialFilters) {
    catalogStore.filters.inStockOnly = partialFilters.inStockOnly
  }
  if (partialFilters && 'minPriceCents' in partialFilters) {
    catalogStore.filters.minPriceCents = partialFilters.minPriceCents
  }
  if (partialFilters && 'maxPriceCents' in partialFilters) {
    catalogStore.filters.maxPriceCents = partialFilters.maxPriceCents
  }
  if (partialFilters?.sort) {
    catalogStore.filters.sort = partialFilters.sort
  }

  const page = partialFilters?.page ?? 1
  const pageSize = partialFilters?.pageSize ?? catalogStore.pagination.pageSize
  const filters = {
    q: catalogStore.filters.q,
    categorySlug: catalogStore.filters.categorySlug,
    brandSlug: catalogStore.filters.brandSlug,
    locale: catalogStore.filters.locale,
    page,
    pageSize,
    inStockOnly: catalogStore.filters.inStockOnly,
    minPriceCents: catalogStore.filters.minPriceCents,
    maxPriceCents: catalogStore.filters.maxPriceCents,
    sort: catalogStore.filters.sort,
  }

  return dedupeAsync(`catalog:products:${productsRequestKey(filters)}`, () => loadProducts(filters))
}

export async function fetchNextProductsPage() {
  if (catalogStore.isLoading || catalogStore.isLoadingMore || !catalogStore.pagination.hasNextPage) {
    return
  }
  catalogStore.isLoadingMore = true
  catalogStore.error = null
  try {
    const result = await api.catalog.products({
      q: catalogStore.filters.q,
      category: catalogStore.filters.categorySlug,
      brand: catalogStore.filters.brandSlug,
      page: catalogStore.pagination.page + 1,
      pageSize: catalogStore.pagination.pageSize,
      locale: catalogStore.filters.locale,
    })
    const merged = applyClientFilters(
      [...catalogStore.products, ...result.items],
      catalogStore.filters,
    )
    catalogStore.products = merged
    catalogStore.pagination = {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    }
  } catch (e) {
    catalogStore.error = errMessage(e)
  } finally {
    catalogStore.isLoadingMore = false
  }
}

export async function fetchProductsByQuery(
  q: string,
  options: { pageSize?: number; locale: string },
): Promise<ProductCardDTO[]> {
  const result = await api.catalog.products({
    q,
    page: 1,
    pageSize: options.pageSize ?? 4,
    locale: options.locale,
  })
  return result.items
}
