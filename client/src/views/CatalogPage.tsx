'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryParams } from '@/lib/navigation'
import { useLocale } from '@/context/locale-context'
import { useLocalePath } from '@/hooks/use-locale-path'
import { SeoHead } from '@/components/SeoHead'
import { useI18n } from '@/hooks/use-i18n'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import { useSnapshot } from 'valtio/react'
import { catalogStore, fetchCatalogBootstrap, fetchNextProductsPage, fetchProducts } from '@/features/catalog'
import { siteStore } from '@/features/site'
import type { CatalogPageContent } from '@/types/site-content'
import { CatalogPageView } from '@/components/site/catalog/CatalogPageView'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import {
  buildActiveFilters,
  buildCatalogSearchQuery,
  centsToPriceBucket,
  filterProductsByWorld,
  parseCatalogWorld,
  priceBucketToCents,
  resolveCategoryGroups,
  type CatalogPriceBucket,
  type CatalogWorldTab,
  worldTabToParam,
} from '@/lib/catalog-filters'

export function CatalogPage({ forcedBrandSlug }: { forcedBrandSlug?: string } = {}) {
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

  const cat = useSnapshot(catalogStore)
  const site = useSnapshot(siteStore)
  const catalogCms = site.pages.catalog
  const [filtersOpen, setFiltersOpen] = useState(true)

  const catalogContent =
    catalogCms && typeof catalogCms === 'object' && 'worlds' in catalogCms
      ? (catalogCms as CatalogPageContent)
      : null

  const effectiveQuery = useMemo(
    () =>
      buildCatalogSearchQuery({
        q: queryParam,
        attacco: attaccoParam,
        colorTemp: colorTempParam,
      }),
    [attaccoParam, colorTempParam, queryParam],
  )

  const { rootCategories, subcategories } = useMemo(
    () => resolveCategoryGroups(cat.categories, categoryParam),
    [cat.categories, categoryParam],
  )

  const effectiveCategory = useMemo(() => {
    if (categoryParam) return categoryParam
    if (worldTab === 'design') {
      const match = cat.categories.find((c) => /arredo|design/i.test(`${c.slug} ${c.name}`))
      return match?.slug
    }
    if (worldTab === 'technical') {
      const match = cat.categories.find((c) => /tecnica|tecnici|lampadine/i.test(`${c.slug} ${c.name}`))
      return match?.slug
    }
    return undefined
  }, [cat.categories, categoryParam, worldTab])

  const visibleProducts = useMemo(() => {
    if (!categoryParam && worldTab !== 'all') {
      return filterProductsByWorld(cat.products, worldTab)
    }
    return cat.products
  }, [cat.products, categoryParam, worldTab])

  const activeFilters = useMemo(
    () =>
      buildActiveFilters({
        categories: cat.categories,
        brands: cat.brands,
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
      cat.brands,
      cat.categories,
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
    hasMore: cat.pagination.hasNextPage,
    loading: cat.isLoading || cat.isLoadingMore,
    onLoadMore: loadMore,
  })

  useEffect(() => {
    void fetchCatalogBootstrap({ locale })
  }, [locale])

  useEffect(() => {
    void fetchProducts({
      categorySlug: effectiveCategory,
      brandSlug: brandParam,
      q: effectiveQuery,
      page: 1,
      pageSize: 24,
      locale,
      inStockOnly,
      sort: sortParam,
      minPriceCents: minPrice,
      maxPriceCents: maxPrice,
    })
  }, [
    brandParam,
    effectiveCategory,
    effectiveQuery,
    inStockOnly,
    locale,
    maxPrice,
    minPrice,
    sortParam,
  ])

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
    <>
      <SeoHead
        title={`Catalogo completo | ${t('brand.name')}`}
        description={t('catalog.metaDescription')}
      />
      <CatalogPageView
        lp={lp}
        error={cat.error}
        isLoading={cat.isLoading}
        isLoadingMore={cat.isLoadingMore}
        products={visibleProducts}
        categories={cat.categories}
        brands={cat.brands}
        totalProducts={cat.pagination.total}
        shownProducts={visibleProducts.length}
        hasMore={cat.pagination.hasNextPage}
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
        onSelectWorldTab={selectWorldTab}
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
    </>
  )
}
