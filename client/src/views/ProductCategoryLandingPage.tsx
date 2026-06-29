'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useQueryParams } from '@/lib/navigation'
import { useLocale } from '@/context/locale-context'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import { useSnapshot } from 'valtio/react'
import {
  catalogStore,
  fetchCatalogBootstrap,
  fetchNextProductsPage,
  fetchProducts,
  reapplyCatalogClientFilters,
} from '@/features/catalog'
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
  toggleCategoryLandingFilter,
  CATEGORY_LANDING_CATALOG_CONFIG,
} from '@/lib/category-landing-filters'
import type { CatalogPriceBucket } from '@/lib/catalog-filters'
import { DesignCategoryView, TechnicalCategoryView } from '@/components/site/category'
import type { CategoryLandingKey } from '@/types/category-landing'

type Props = {
  pageKey: CategoryLandingKey
}

export function ProductCategoryLandingPage({ pageKey }: Props) {
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

  const sortLabel = categoryLandingSortLabel(sortParam)

  const loadMore = useCallback(() => {
    void fetchNextProductsPage()
  }, [])

  useEffect(() => {
    void fetchCatalogBootstrap({ locale })
  }, [locale])

  useEffect(() => {
    void fetchProducts({
      categorySlug: catalogConfig.categorySlug,
      brandSlug,
      q: effectiveQuery,
      page: 1,
      pageSize: content.pageSize,
      locale,
    })
  }, [
    brandSlug,
    catalogConfig.categorySlug,
    content.pageSize,
    effectiveQuery,
    locale,
  ])

  useEffect(() => {
    catalogStore.filters.inStockOnly = inStockOnly
    catalogStore.filters.sort = sortParam
    catalogStore.filters.minPriceCents = minPriceCents
    catalogStore.filters.maxPriceCents = maxPriceCents
    reapplyCatalogClientFilters()
  }, [inStockOnly, sortParam, minPriceCents, maxPriceCents])

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
    products: cat.products,
    totalCount: cat.pagination.total,
    loading: cat.isLoading,
    isLoadingMore: cat.isLoadingMore,
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
