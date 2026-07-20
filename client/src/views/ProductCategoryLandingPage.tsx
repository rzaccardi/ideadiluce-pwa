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
  fetchCatalogFilters,
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
import {
  buildDesignTypeTilesFromFacets,
  buildLandingFilterGroupsFromFacets,
  buildLandingStatsFromFacets,
  buildTechnicalSubtypeChipsFromFacets,
  facetWattaggioNumericValues,
} from '@/lib/catalog-facets-ui'
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
  const world = pageKey === 'design' ? ('design' as const) : ('technical' as const)

  const cat = useSnapshot(catalogStore)
  const selectedFilterValues = useMemo(() => parseCategoryLandingFilters(params), [params])
  const brandParam = params.get('brand') ?? undefined
  const inStockFromUrl = params.get('inStock') === '1' || params.get('inStock') === 'true'
  const sortParam = (params.get('sort') as CatalogSort | null) ?? 'relevance'
  const priceBucketParam = (params.get('priceBucket') as CatalogPriceBucket | null) ?? undefined
  const minPriceFromUrl = params.get('minPrice') ? Number(params.get('minPrice')) * 100 : undefined
  const maxPriceFromUrl = params.get('maxPrice') ? Number(params.get('maxPrice')) * 100 : undefined

  const filterGroups = useMemo(
    () =>
      buildLandingFilterGroupsFromFacets(
        pageKey,
        cat.facets as import('@/types/dto').CatalogFiltersDTO | null,
        content.filterGroups,
      ),
    [pageKey, cat.facets, content.filterGroups],
  )

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
  const categorySlug = specFilters.categorySlugFromFacet ?? catalogConfig.categorySlug
  const wattaggioMinNum = specFilters.wattaggioMin
    ? Number(specFilters.wattaggioMin)
    : undefined
  const wattaggioMaxNum = specFilters.wattaggioMax
    ? Number(specFilters.wattaggioMax)
    : undefined
  const wattaggioMin =
    wattaggioMinNum != null && Number.isFinite(wattaggioMinNum) ? wattaggioMinNum : undefined
  const wattaggioMax =
    wattaggioMaxNum != null && Number.isFinite(wattaggioMaxNum) ? wattaggioMaxNum : undefined
  const wattaggioValues = useMemo(
    () => facetWattaggioNumericValues(cat.facets as import('@/types/dto').CatalogFiltersDTO | null),
    [cat.facets],
  )

  const landingContent = useMemo(() => {
    const facets = cat.facets as import('@/types/dto').CatalogFiltersDTO | null
    if (isDesign) {
      return {
        ...content,
        typeTiles: buildDesignTypeTilesFromFacets(facets, content.typeTiles),
        stats: buildLandingStatsFromFacets(facets, content.stats),
        filterGroups,
      }
    }
    return {
      ...content,
      subtypeChips: buildTechnicalSubtypeChipsFromFacets(facets, {
        fallback: content.subtypeChips,
        baseHref:
          pageKey === 'technical-products'
            ? '/categoria-prodotto/illuminazione-tecnica/prodotti-tecnici'
            : '/categoria-prodotto/illuminazione-tecnica',
        selectedCategorySlug: specFilters.categorySlugFromFacet,
      }),
      filterGroups,
    }
  }, [
    cat.facets,
    content,
    filterGroups,
    isDesign,
    pageKey,
    specFilters.categorySlugFromFacet,
  ])

  const effectiveQuery = buildCategoryLandingSearchQuery({
    pageKey,
    baseQuery: content.searchQuery ?? catalogConfig.baseQuery,
    selected: selectedFilterValues,
    groups: filterGroups,
    brandSlug,
  })

  const activeFilters = useMemo(
    () =>
      buildCategoryLandingActiveFilters({
        groups: filterGroups,
        selected: selectedFilterValues,
        wattaggioMin,
        wattaggioMax,
      }),
    [filterGroups, selectedFilterValues, wattaggioMin, wattaggioMax],
  )

  const visibleProducts = cat.products
  const sortLabel = categoryLandingSortLabel(sortParam)
  const pendingSkeletonCount = catalogPendingLoadCount(
    cat.isLoadingMore,
    cat.pagination,
    cat.rawProducts.length,
  )

  const initialSeedKey = useMemo(() => {
    if (!initialProducts) return null
    return catalogServerFetchKey({
      page: 1,
      pageSize: content.pageSize,
      locale,
      brandSlug,
      categorySlug: catalogConfig.categorySlug,
      attacco: specFilters.attacco,
      colorTemp: specFilters.colorTemp,
      wattaggio: specFilters.wattaggio,
      wattaggioMin: specFilters.wattaggioMin,
      wattaggioMax: specFilters.wattaggioMax,
      world,
      q: effectiveQuery || undefined,
    })
  }, [
    initialProducts,
    locale,
    brandSlug,
    catalogConfig.categorySlug,
    content.pageSize,
    effectiveQuery,
    specFilters.attacco,
    specFilters.colorTemp,
    specFilters.wattaggio,
    specFilters.wattaggioMin,
    specFilters.wattaggioMax,
    world,
  ])

  useLayoutEffect(() => {
    if (!initialBootstrap) return
    seedCatalogBootstrap(initialBootstrap, locale)
  }, [initialBootstrap, locale])

  useLayoutEffect(() => {
    if (!initialProducts || !initialSeedKey) return
    catalogStore.filters.locale = locale
    catalogStore.filters.categorySlug = catalogConfig.categorySlug
    catalogStore.filters.brandSlug = brandSlug
    catalogStore.filters.q = effectiveQuery
    catalogStore.filters.attacco = specFilters.attacco
    catalogStore.filters.colorTemp = specFilters.colorTemp
    catalogStore.filters.wattaggio = specFilters.wattaggio
    catalogStore.filters.wattaggioMin = specFilters.wattaggioMin
    catalogStore.filters.wattaggioMax = specFilters.wattaggioMax
    catalogStore.filters.tipologia = specFilters.tipologia
    catalogStore.filters.ambiente = specFilters.ambiente
    catalogStore.filters.stile = specFilters.stile
    catalogStore.filters.world = world
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
    specFilters.wattaggio,
    specFilters.wattaggioMin,
    specFilters.wattaggioMax,
    specFilters.tipologia,
    specFilters.ambiente,
    specFilters.stile,
    world,
  ])

  useEffect(() => {
    void fetchCatalogBootstrap({ locale, skipIfFresh: true })
  }, [locale])

  useEffect(() => {
    void fetchProducts({
      categorySlug,
      brandSlug,
      q: effectiveQuery,
      page: 1,
      pageSize: content.pageSize,
      locale,
      attacco: specFilters.attacco,
      colorTemp: specFilters.colorTemp,
      wattaggio: specFilters.wattaggio,
      wattaggioMin: specFilters.wattaggioMin,
      wattaggioMax: specFilters.wattaggioMax,
      tipologia: specFilters.tipologia,
      ambiente: specFilters.ambiente,
      stile: specFilters.stile,
      world,
      sort: sortParam,
    })
    void fetchCatalogFilters({
      categorySlug,
      brandSlug,
      q: effectiveQuery,
      attacco: specFilters.attacco,
      colorTemp: specFilters.colorTemp,
      wattaggio: specFilters.wattaggio,
      wattaggioMin: specFilters.wattaggioMin,
      wattaggioMax: specFilters.wattaggioMax,
      tipologia: specFilters.tipologia,
      ambiente: specFilters.ambiente,
      stile: specFilters.stile,
      world,
      locale,
    })
  }, [
    brandSlug,
    categorySlug,
    content.pageSize,
    effectiveQuery,
    locale,
    specFilters.attacco,
    specFilters.colorTemp,
    specFilters.wattaggio,
    specFilters.wattaggioMin,
    specFilters.wattaggioMax,
    specFilters.tipologia,
    specFilters.ambiente,
    specFilters.stile,
    sortParam,
    world,
  ])

  useEffect(() => {
    catalogStore.filters.inStockOnly = inStockOnly
    catalogStore.filters.sort = sortParam
    catalogStore.filters.minPriceCents = minPriceCents
    catalogStore.filters.maxPriceCents = maxPriceCents
    catalogStore.filters.attacco = specFilters.attacco
    catalogStore.filters.colorTemp = specFilters.colorTemp
    catalogStore.filters.wattaggio = specFilters.wattaggio
    catalogStore.filters.wattaggioMin = specFilters.wattaggioMin
    catalogStore.filters.wattaggioMax = specFilters.wattaggioMax
    catalogStore.filters.tipologia = specFilters.tipologia
    catalogStore.filters.ambiente = specFilters.ambiente
    catalogStore.filters.stile = specFilters.stile
    catalogStore.filters.world = world
    reapplyCatalogClientFilters()
  }, [
    inStockOnly,
    sortParam,
    minPriceCents,
    maxPriceCents,
    specFilters.attacco,
    specFilters.colorTemp,
    specFilters.wattaggio,
    specFilters.wattaggioMin,
    specFilters.wattaggioMax,
    specFilters.tipologia,
    specFilters.ambiente,
    specFilters.stile,
    world,
  ])

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
    if (key === 'wattaggio') {
      const next = new URLSearchParams(params)
      next.delete('page')
      next.delete('pagination')
      next.delete('wattaggio')
      next.delete('wattaggio_min')
      next.delete('wattaggio_max')
      setParams(next)
      return
    }
    setFilterParams(removeCategoryLandingFilter(selectedFilterValues, key))
  }

  function selectWattaggioRange(range: { min?: number; max?: number }) {
    const next = new URLSearchParams(params)
    next.delete('page')
    next.delete('pagination')
    next.delete('wattaggio')
    if (range.min != null) next.set('wattaggio_min', String(range.min))
    else next.delete('wattaggio_min')
    if (range.max != null) next.set('wattaggio_max', String(range.max))
    else next.delete('wattaggio_max')
    setParams(next)
  }

  function selectSort(sort: CatalogSort) {
    const next = new URLSearchParams(params)
    next.delete('page')
    next.delete('pagination')
    if (sort === 'relevance') next.delete('sort')
    else next.set('sort', sort)
    setParams(next)
  }

  const loadMore = useCallback(() => {
    void fetchNextProductsPage()
  }, [])

  const catalogSectionProps = {
    content: {
      ...landingContent,
      sortValue: sortLabel,
    },
    products: visibleProducts,
    totalCount: cat.pagination.total || visibleProducts.length,
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
    <TechnicalCategoryView
      {...catalogSectionProps}
      wattaggioValues={wattaggioValues}
      wattaggioMin={wattaggioMin}
      wattaggioMax={wattaggioMax}
      onSelectWattaggioRange={selectWattaggioRange}
    />
  )
}
