import { getRequestLocale } from '@/lib/locale-server'
import { fetchCatalogBootstrapServer } from '@/lib/server-catalog'
import { ProductCategoryLandingPage } from '@/views/ProductCategoryLandingPage'
import type { CategoryLandingKey } from '@/types/category-landing'

export async function CategoryLandingRoutePage({ pageKey }: { pageKey: CategoryLandingKey }) {
  const locale = await getRequestLocale()
  const initialBootstrap = await fetchCatalogBootstrapServer(locale)

  return <ProductCategoryLandingPage pageKey={pageKey} initialBootstrap={initialBootstrap} />
}
