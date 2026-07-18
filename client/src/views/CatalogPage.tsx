'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useQueryParams } from '@/lib/navigation'
import { useLocale } from '@/context/locale-context'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import { useSnapshot } from 'valtio/react'
import { catalogStore, fetchCatalogBootstrap, fetchNextProductsPage, fetchProducts, reapplyCatalogClientFilters, seedCatalogBootstrap, seedCatalogProducts, catalogServerFetchKey } from '@/features/catalog'
import type { CatalogBootstrapServerData } from '@/lib/server-catalog'
import { siteStore } from '@/features/site'
import type { CatalogPageContent } from '@/types/site-content'
import { CatalogPageView } from '@/components/site/catalog/CatalogPageView'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import type { ProductCardDTO } from '@/types/dto'
import {
  buildActiveFilters,
  buildCatalogApiQuery,
  centsToPriceBucket,
  parseCatalogWorld,
  priceBucketToCents,
  resolveCategoryGroups,
  resolveEffectiveCatalogCategory,
  type CatalogPriceBucket,
  type CatalogWorldTab,
  worldTabToParam,
} from '@/lib/catalog-filters'
import { catalogPendingLoadCount } from '@/lib/catalog-pagination'

export function CatalogPage({
  forcedBrandSlug,
  initialProducts,
  initialBootstrap,
  initialPagination,
}: {
  forcedBrandSlug?: string
  initialProducts?: ProductCardDTO[]
  initialBootstrap?: CatalogBootstrapServerData
  initialPagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
} = {}) {
  const { locale } = useLocale()
  const lp = useLocalePath()
  const { t } = useI18n()
  const [params, setParams] = useQueryParams()
  const brandParam = forcedBrandSlug ?? params.get('brand') ?? undefined
  const categoryParam = params.get('category') ?? undefined
  const worldTab = parseCatalogWorld(params.get('world'))
  const queryParam = params.get('q')?.trim() ?? ''
  const attaccoParam = params.get('attacco')?.trim() ?? ''
  const colorTempParam = params.get('colorTemp')?.trim() ?? ''
  const priceBucketParam = (params.get('priceBucket') as CatalogPriceBucket | null) ?? undefined
  const inStockOnly = params.get('inStock') === '1' || params.get('inStock') === 'true'
  const sortParam = (params.get('sort') as CatalogSort | null) ?? 'relevance'
  const minPriceFromUrl = params.get('minPrice') ? Number(params.get('minPrice')) * 100 : undefined
  const maxPriceFromUrl = params.get('maxPrice') ? Number(params.get('maxPrice')) * 100 : undefined
  const bucketCents = priceBucketToCents(priceBucketParam)
  const minPrice = bucketCents.minPriceCents ?? minPriceFromUrl
  const maxPrice = bucketCents.maxPriceCents ?? maxPriceFromUrl
  const selectedPriceBucket =
    priceBucketParam ?? centsToPriceBucket(minPriceFromUrl, maxPriceFromUrl)

  const products = useSnapshot(catalogStore).products
  const categories = useSnapshot(catalogStore).categories
  const brands = useSnapshot(catalogStore).brands
  const catalogLoading = useSnapshot(catalogStore).isLoading
  const catalogLoadingMore = useSnapshot(catalogStore).isLoadingMore
  const catalogError = useSnapshot(catalogStore).error
  const catalogPagination = useSnapshot(catalogStore).pagination
  const rawProductsLength = useSnapshot(catalogStore).rawProducts.length
  const catalogCms = useSnapshot(siteStore).pages.catalog
  const [filtersOpen, setFiltersOpen] = useState(true)

  const catalogContent =
    catalogCms && typeof catalogCms === 'object' && 'worlds' in catalogCms
      ? (catalogCms as CatalogPageContent)
      : null

  const effectiveQuery = useMemo(
    () => buildCatalogApiQuery(queryParam),
    [queryParam],
  )

  const effectiveCategory = useMemo(
    () =>
      resolveEffectiveCatalogCategory({
        categoryParam,
        worldTab,
        attacco: attaccoParam,
        colorTemp: colorTempParam,
      }),
    [attaccoParam, categoryParam, colorTempParam, worldTab],
  )

  const visibleProducts = products

  const { rootCategories, subcategories } = useMemo(
    () => resolveCategoryGroups(categories, categoryParam),
    [categories, categoryParam],
  )

  const clientWorld = worldTab === 'all' ? undefined : worldTab

  const activeFilters = useMemo(
    () =>
      buildActiveFilters({
        categories,
        brands,
        categorySlug: categoryParam,
        brandSlug: brandParam,
        attacco: attaccoParam || undefined,
        colorTemp: colorTempParam || undefined,
        priceBucket: selectedPriceBucket,
        inStockOnly,
        q: queryParam || undefined,
        world: worldTab,
      }),
    [
      attaccoParam,
      brandParam,
      brands,
      categories,
      categoryParam,
      colorTempParam,
      inStockOnly,
      queryParam,
      selectedPriceBucket,
      worldTab,
    ],
  )

  const designLabel = catalogContent?.worlds.design.title ?? 'Arredo'
  const technicalLabel = catalogContent?.worlds.technical.title ?? 'Tecnica'

  const loadMore = useCallback(() => {
    void fetchNextProductsPage()
  }, [])

  const loadMoreRef = useInfiniteScrollSentinel({
    hasMore: catalogPagination.hasNextPage,
    loading: catalogLoading || catalogLoadingMore,
    onLoadMore: loadMore,
  })

  const pendingSkeletonCount = catalogPendingLoadCount(
    catalogLoadingMore,
    catalogPagination,
    rawProductsLength,
  )

  const initialSeedKey = useMemo(() => {
    if (!initialProducts?.length) return null
    return catalogServerFetchKey({
      page: 1,
      pageSize: 24,
      locale,
      brandSlug: brandParam,
      categorySlug: effectiveCategory,
      attacco: attaccoParam || undefined,
      colorTemp: colorTempParam || undefined,
      q: effectiveQuery || undefined,
    })
  }, [
    initialProducts,
    locale,
    brandParam,
    effectiveCategory,
    attaccoParam,
    colorTempParam,
    effectiveQuery,
  ])

  useLayoutEffect(() => {
    if (!initialBootstrap) return
    seedCatalogBootstrap(initialBootstrap, locale)
  }, [initialBootstrap, locale])

  useLayoutEffect(() => {
    if (!initialProducts || !initialSeedKey) return
    // Allinea i filtri server prima dello seed, così fetchProducts non rifà il round-trip.
    catalogStore.filters.locale = locale
    catalogStore.filters.categorySlug = effectiveCategory
    catalogStore.filters.brandSlug = brandParam
    catalogStore.filters.q = effectiveQuery
    catalogStore.filters.attacco = attaccoParam || undefined
    catalogStore.filters.colorTemp = colorTempParam || undefined
    catalogStore.filters.world = clientWorld
    seedCatalogProducts(
      initialProducts,
      initialSeedKey,
      initialPagination ?? {
        total: initialProducts.length,
        hasNextPage: initialProducts.length >= 24,
      },
    )
  }, [
    initialProducts,
    initialSeedKey,
    initialPagination,
    locale,
    effectiveCategory,
    brandParam,
    effectiveQuery,
    attaccoParam,
    colorTempParam,
    clientWorld,
  ])

  useEffect(() => {
    void fetchCatalogBootstrap({ locale, skipIfFresh: true })
  }, [locale])

  useEffect(() => {
    void fetchProducts({
      categorySlug: effectiveCategory,
      brandSlug: brandParam,
      q: effectiveQuery,
      page: 1,
      pageSize: 24,
      locale,
      attacco: attaccoParam || undefined,
      colorTemp: colorTempParam || undefined,
      world: clientWorld,
    })
  }, [attaccoParam, brandParam, clientWorld, colorTempParam, effectiveCategory, effectiveQuery, locale])

  useEffect(() => {
    catalogStore.filters.inStockOnly = inStockOnly
    catalogStore.filters.sort = sortParam
    catalogStore.filters.minPriceCents = minPrice
    catalogStore.filters.maxPriceCents = maxPrice
    catalogStore.filters.attacco = attaccoParam || undefined
    catalogStore.filters.colorTemp = colorTempParam || undefined
    catalogStore.filters.world = clientWorld
    reapplyCatalogClientFilters()
  }, [attaccoParam, clientWorld, colorTempParam, inStockOnly, sortParam, minPrice, maxPrice])

  function patchParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params)
    next.delete('page')
    next.delete('pagination')
    mutate(next)
    setParams(next)
  }

  function updateFilterParam(key: string, value: string | null) {
    patchParams((next) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
  }

  function selectCategory(categorySlug?: string) {
    updateFilterParam('category', categorySlug ?? null)
  }

  function selectBrand(brandSlug?: string) {
    updateFilterParam('brand', brandSlug ?? null)
  }

  function selectAttacco(value?: string) {
    updateFilterParam('attacco', value ?? null)
  }

  function selectColorTemp(value?: string) {
    updateFilterParam('colorTemp', value ?? null)
  }

  function selectPriceBucket(value?: CatalogPriceBucket) {
    patchParams((next) => {
      next.delete('minPrice')
      next.delete('maxPrice')
      if (value) next.set('priceBucket', value)
      else next.delete('priceBucket')
    })
  }

  function toggleInStockOnly(enabled: boolean) {
    updateFilterParam('inStock', enabled ? '1' : null)
  }

  function selectWorldTab(tab: CatalogWorldTab) {
    patchParams((next) => {
      const world = worldTabToParam(tab)
      if (world) next.set('world', world)
      else next.delete('world')
    })
  }

  function resetFilters() {
    patchParams((next) => {
      next.delete('category')
      next.delete('brand')
      next.delete('q')
      next.delete('attacco')
      next.delete('colorTemp')
      next.delete('priceBucket')
      next.delete('minPrice')
      next.delete('maxPrice')
      next.delete('inStock')
      next.delete('world')
      next.delete('sort')
    })
  }

  function removeFilter(key: string) {
    switch (key) {
      case 'world':
        selectWorldTab('all')
        break
      case 'category':
        selectCategory(undefined)
        break
      case 'brand':
        selectBrand(undefined)
        break
      case 'attacco':
        selectAttacco(undefined)
        break
      case 'colorTemp':
        selectColorTemp(undefined)
        break
      case 'priceBucket':
        selectPriceBucket(undefined)
        break
      case 'inStock':
        toggleInStockOnly(false)
        break
      case 'q':
        updateFilterParam('q', null)
        break
      default:
        break
    }
  }


  return (
    <CatalogPageView
        lp={lp}
        error={catalogError}
        isLoading={catalogLoading}
        isLoadingMore={catalogLoadingMore}
        pendingSkeletonCount={pendingSkeletonCount}
        products={visibleProducts}
        categories={categories}
        brands={brands}
        totalProducts={catalogPagination.total}
        shownProducts={visibleProducts.length}
        hasMore={catalogPagination.hasNextPage}
        worldTab={worldTab}
        designLabel={designLabel}
        technicalLabel={technicalLabel}
        filtersOpen={filtersOpen}
        rootCategories={rootCategories}
        subcategories={subcategories}
        selectedCategorySlug={categoryParam}
        selectedBrandSlug={brandParam}
        selectedAttacco={attaccoParam || undefined}
        selectedColorTemp={colorTempParam || undefined}
        selectedPriceBucket={selectedPriceBucket}
        inStockOnly={inStockOnly}
        activeFilters={activeFilters}
        sort={sortParam}
        loadMoreRef={loadMoreRef}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
        onSelectCategory={selectCategory}
        onSelectBrand={selectBrand}
        onSelectAttacco={selectAttacco}
        onSelectColorTemp={selectColorTemp}
        onSelectPriceBucket={selectPriceBucket}
        onToggleInStock={toggleInStockOnly}
        onResetFilters={resetFilters}
        onRemoveFilter={removeFilter}
        onSelectSort={(sort) => updateFilterParam('sort', sort === 'relevance' ? null : sort)}
        onLoadMore={loadMore}
        emptyTitle={t('catalog.emptyTitle')}
        emptyDescription={t('catalog.emptyDescription')}
        searchQuery={queryParam}
      />
  )
}
