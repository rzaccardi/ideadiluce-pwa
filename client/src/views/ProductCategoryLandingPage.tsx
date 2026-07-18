'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { useQueryParams } from '@/lib/navigation'
import { useLocale } from '@/context/locale-context'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import { useSnapshot } from 'valtio/react'
import {
  catalogStore,
  catalogServerFetchKey,
  fetchCatalogBootstrap,
  fetchNextProductsPage,
  fetchProducts,
  reapplyCatalogClientFilters,
  seedCatalogBootstrap,
  seedCatalogProducts,
} from '@/features/catalog'
import type { CatalogBootstrapServerData } from '@/lib/server-catalog'
import type { ProductCardDTO } from '@/types/dto'
import { getCategoryLandingContent } from '@/lib/category-landing.defaults'
import {
  buildCategoryLandingActiveFilters,
  buildCategoryLandingSearchQuery,
  categoryLandingSortLabel,
  parseCategoryLandingFilters,
  patchCategoryLandingFilterParams,
  removeCategoryLandingFilter,
  resetCategoryLandingFilterParams,
  resolveCategoryLandingBrandSlug,
  resolveCategoryLandingInStock,
  resolveCategoryLandingPriceCents,
  resolveCategoryLandingSpecFilters,
  toggleCategoryLandingFilter,
  CATEGORY_LANDING_CATALOG_CONFIG,
} from '@/lib/category-landing-filters'
import { filterProductsBySpec } from '@/lib/catalog-filters'
import type { CatalogPriceBucket } from '@/lib/catalog-filters'
import { catalogPendingLoadCount } from '@/lib/catalog-pagination'
import { DesignCategoryView, TechnicalCategoryView } from '@/components/site/category'
import type { CategoryLandingKey } from '@/types/category-landing'

type Props = {
  pageKey: CategoryLandingKey
  initialBootstrap?: CatalogBootstrapServerData
  initialProducts?: ProductCardDTO[]
  initialPagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function ProductCategoryLandingPage({
  pageKey,
  initialBootstrap,
  initialProducts,
  initialPagination,
}: Props) {
  const { locale } = useLocale()
  const lp = useLocalePath()
  const [params, setParams] = useQueryParams()
  const content = getCategoryLandingContent(pageKey)
  const catalogConfig = CATEGORY_LANDING_CATALOG_CONFIG[pageKey]
  const isDesign = pageKey === 'design'

  const cat = useSnapshot(catalogStore)
  const selectedFilterValues = useMemo(() => parseCategoryLandingFilters(params), [params])
  const brandParam = params.get('brand') ?? undefined
  const inStockFromUrl = params.get('inStock') === '1' || params.get('inStock') === 'true'
  const sortParam = (params.get('sort') as CatalogSort | null) ?? 'relevance'
  const priceBucketParam = (params.get('priceBucket') as CatalogPriceBucket | null) ?? undefined
  const minPriceFromUrl = params.get('minPrice') ? Number(params.get('minPrice')) * 100 : undefined
  const maxPriceFromUrl = params.get('maxPrice') ? Number(params.get('maxPrice')) * 100 : undefined

  const inStockOnly = resolveCategoryLandingInStock(selectedFilterValues, inStockFromUrl)
  const { minPriceCents, maxPriceCents } = resolveCategoryLandingPriceCents(
    pageKey,
    selectedFilterValues,
    priceBucketParam,
    minPriceFromUrl,
    maxPriceFromUrl,
  )
  const brandSlug = resolveCategoryLandingBrandSlug(selectedFilterValues, cat.brands, brandParam)
  const specFilters = useMemo(
    () => resolveCategoryLandingSpecFilters(selectedFilterValues, params),
    [params, selectedFilterValues],
  )
  const effectiveQuery = buildCategoryLandingSearchQuery({
    pageKey,
    baseQuery: content.searchQuery ?? catalogConfig.baseQuery,
    selected: selectedFilterValues,
    groups: content.filterGroups,
    brandSlug,
  })

  const activeFilters = useMemo(
    () =>
      buildCategoryLandingActiveFilters({
        groups: content.filterGroups,
        selected: selectedFilterValues,
      }),
    [content.filterGroups, selectedFilterValues],
  )

  const visibleProducts = useMemo(
    () => filterProductsBySpec(cat.products, specFilters),
    [cat.products, specFilters],
  )

  const sortLabel = categoryLandingSortLabel(sortParam)

  const pendingSkeletonCount = catalogPendingLoadCount(
    cat.isLoadingMore,
    cat.pagination,
    cat.rawProducts.length,
  )

  const loadMore = useCallback(() => {
    void fetchNextProductsPage()
  }, [])

  useLayoutEffect(() => {
    if (!initialBootstrap) return
    seedCatalogBootstrap(initialBootstrap, locale)
  }, [initialBootstrap, locale])

  const initialSeedKey = useMemo(() => {
    if (!initialProducts?.length) return null
    return catalogServerFetchKey({
      page: 1,
      pageSize: content.pageSize,
      locale,
      brandSlug,
      categorySlug: catalogConfig.categorySlug,
      attacco: specFilters.attacco,
      colorTemp: specFilters.colorTemp,
      q: effectiveQuery || undefined,
    })
  }, [
    initialProducts,
    content.pageSize,
    locale,
    brandSlug,
    catalogConfig.categorySlug,
    specFilters.attacco,
    specFilters.colorTemp,
    effectiveQuery,
  ])

  useLayoutEffect(() => {
    if (!initialProducts || !initialSeedKey) return
    catalogStore.filters.locale = locale
    catalogStore.filters.categorySlug = catalogConfig.categorySlug
    catalogStore.filters.brandSlug = brandSlug
    catalogStore.filters.q = effectiveQuery
    catalogStore.filters.attacco = specFilters.attacco
    catalogStore.filters.colorTemp = specFilters.colorTemp
    seedCatalogProducts(initialProducts, initialSeedKey, initialPagination)
  }, [
    initialProducts,
    initialSeedKey,
    initialPagination,
    locale,
    catalogConfig.categorySlug,
    brandSlug,
    effectiveQuery,
    specFilters.attacco,
    specFilters.colorTemp,
  ])

  useEffect(() => {
    void fetchCatalogBootstrap({ locale, skipIfFresh: true })
  }, [locale])

  useEffect(() => {
    void fetchProducts({
      categorySlug: catalogConfig.categorySlug,
      brandSlug,
      q: effectiveQuery,
      page: 1,
      pageSize: content.pageSize,
      locale,
      attacco: specFilters.attacco,
      colorTemp: specFilters.colorTemp,
    })
  }, [
    brandSlug,
    catalogConfig.categorySlug,
    content.pageSize,
    effectiveQuery,
    locale,
    specFilters.attacco,
    specFilters.colorTemp,
  ])

  useEffect(() => {
    catalogStore.filters.inStockOnly = inStockOnly
    catalogStore.filters.sort = sortParam
    catalogStore.filters.minPriceCents = minPriceCents
    catalogStore.filters.maxPriceCents = maxPriceCents
    catalogStore.filters.attacco = specFilters.attacco
    catalogStore.filters.colorTemp = specFilters.colorTemp
    reapplyCatalogClientFilters()
  }, [inStockOnly, sortParam, minPriceCents, maxPriceCents, specFilters.attacco, specFilters.colorTemp])

  function setFilterParams(nextValues: Set<string>) {
    setParams(patchCategoryLandingFilterParams(params, nextValues))
  }

  function toggleFilter(value: string) {
    setFilterParams(toggleCategoryLandingFilter(selectedFilterValues, value))
  }

  function resetFilters() {
    setParams(resetCategoryLandingFilterParams(params))
  }

  function removeFilter(key: string) {
    setFilterParams(removeCategoryLandingFilter(selectedFilterValues, key))
  }

  function selectSort(sort: CatalogSort) {
    const next = new URLSearchParams(params)
    next.delete('page')
    next.delete('pagination')
    if (sort === 'relevance') next.delete('sort')
    else next.set('sort', sort)
    setParams(next)
  }

  const catalogSectionProps = {
    content: {
      ...content,
      sortValue: sortLabel,
    },
    products: visibleProducts,
    totalCount: visibleProducts.length > 0 ? visibleProducts.length : cat.pagination.total,
    loading: cat.isLoading,
    isLoadingMore: cat.isLoadingMore,
    pendingSkeletonCount,
    hasMore: cat.pagination.hasNextPage,
    onLoadMore: loadMore,
    selectedFilterValues,
    activeFilters,
    sort: sortParam,
    onToggleFilter: toggleFilter,
    onResetFilters: resetFilters,
    onRemoveFilter: removeFilter,
    onSelectSort: selectSort,
    lp,
  }

  return isDesign ? (
    <DesignCategoryView {...catalogSectionProps} />
  ) : (
    <TechnicalCategoryView {...catalogSectionProps} />
  )
}
