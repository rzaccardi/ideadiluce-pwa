import { getRequestLocale } from '@/lib/locale-server'
import {
  fetchCatalogBootstrapServer,
  fetchCatalogProductsServer,
} from '@/lib/server-catalog'
import { ProductCategoryLandingPage } from '@/views/ProductCategoryLandingPage'
import type { CategoryLandingKey } from '@/types/category-landing'
import { CATEGORY_LANDING_CATALOG_CONFIG } from '@/lib/category-landing-filters'
import { getCategoryLandingContent } from '@/lib/category-landing.defaults'

export async function CategoryLandingRoutePage({ pageKey }: { pageKey: CategoryLandingKey }) {
  const locale = await getRequestLocale()
  const catalogConfig = CATEGORY_LANDING_CATALOG_CONFIG[pageKey]
  const content = getCategoryLandingContent(pageKey)

  const [initialBootstrap, productsRes] = await Promise.all([
    fetchCatalogBootstrapServer(locale),
    fetchCatalogProductsServer(locale, {
      pageSize: content.pageSize,
      category: catalogConfig.categorySlug,
      q: content.searchQuery ?? catalogConfig.baseQuery,
    }),
  ])

  return (
    <ProductCategoryLandingPage
      pageKey={pageKey}
      initialBootstrap={initialBootstrap}
      initialProducts={productsRes.items}
      initialPagination={{
        page: productsRes.page,
        pageSize: productsRes.pageSize,
        total: productsRes.total,
        totalPages: productsRes.totalPages,
        hasNextPage: productsRes.hasNextPage,
        hasPreviousPage: productsRes.hasPreviousPage,
      }}
    />
  )
}
