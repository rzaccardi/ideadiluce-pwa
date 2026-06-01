import { api } from '@/api/endpoints'
import { ApiRequestError } from '@/types/api'
import { catalogStore } from './catalog.store'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore catalogo'
}

export async function fetchCategories() {
  catalogStore.isLoading = true
  catalogStore.error = null
  try {
    catalogStore.categories = await api.catalog.categories()
  } catch (e) {
    catalogStore.error = errMessage(e)
  } finally {
    catalogStore.isLoading = false
  }
}

export async function fetchProducts(partialFilters?: {
  categorySlug?: string
  q?: string
  page?: number
  pageSize?: number
}) {
  if (partialFilters && 'categorySlug' in partialFilters) {
    catalogStore.filters.categorySlug = partialFilters.categorySlug
  }
  if (partialFilters && 'q' in partialFilters) {
    catalogStore.filters.q = partialFilters.q
  }
  catalogStore.isLoading = true
  catalogStore.error = null
  try {
    const page = partialFilters?.page ?? 1
    const result = await api.catalog.products({
      category: catalogStore.filters.categorySlug,
      q: catalogStore.filters.q,
      page,
      pageSize: partialFilters?.pageSize ?? catalogStore.pagination.pageSize,
    })
    catalogStore.products = result.items
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

export async function fetchNextProductsPage() {
  if (catalogStore.isLoading || catalogStore.isLoadingMore || !catalogStore.pagination.hasNextPage) {
    return
  }
  catalogStore.isLoadingMore = true
  catalogStore.error = null
  try {
    const result = await api.catalog.products({
      category: catalogStore.filters.categorySlug,
      q: catalogStore.filters.q,
      page: catalogStore.pagination.page + 1,
      pageSize: catalogStore.pagination.pageSize,
    })
    catalogStore.products = [...catalogStore.products, ...result.items]
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
