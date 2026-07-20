'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useQueryParams } from '@/lib/navigation'
import { useLocale } from '@/context/locale-context'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import { useSnapshot } from 'valtio/react'
import { catalogStore, fetchCatalogBootstrap, fetchCatalogFilters, fetchNextProductsPage, fetchProducts, reapplyCatalogClientFilters, seedCatalogBootstrap, seedCatalogProducts, catalogServerFetchKey } from '@/features/catalog'
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
import {
  attaccoPathSlugFromCode,
  taxonomyPageTitle,
  taxonomyPath,
  type CatalogTaxonomyContext,
  type CatalogTaxonomyKind,
} from '@/lib/catalog-taxonomy'
import { useRouter } from '@/lib/navigation'

export function CatalogPage({
  forcedBrandSlug,
  forcedTaxonomy,
  initialProducts,
  initialBootstrap,
  initialPagination,
}: {
  forcedBrandSlug?: string
  /** Listing su URL tassonomia (/attacco/gu10, /stile/moderno, …). */
  forcedTaxonomy?: CatalogTaxonomyContext
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
  const router = useRouter()
  const { t } = useI18n()
  const [params, setParams] = useQueryParams()
  const taxonomy = forcedTaxonomy

  const brandParam =
    taxonomy?.kind === 'brand'
      ? taxonomy.value
      : (forcedBrandSlug ?? params.get('brand') ?? undefined)
  const categoryParam =
    taxonomy?.kind === 'category' ? taxonomy.value : (params.get('category') ?? undefined)
  const worldTab: CatalogWorldTab = taxonomy?.world
    ? taxonomy.world
    : parseCatalogWorld(params.get('world'))
  const queryParam = params.get('q')?.trim() ?? ''
  const attaccoParam =
    taxonomy?.kind === 'attacco' ? taxonomy.value : (params.get('attacco')?.trim() ?? '')
  const colorTempParam = params.get('colorTemp')?.trim() ?? ''
  const wattaggioParam = params.get('wattaggio')?.trim() ?? ''
  const wattaggioMinParam = params.get('wattaggio_min')?.trim() ?? ''
  const wattaggioMaxParam = params.get('wattaggio_max')?.trim() ?? ''
  const tipologiaParam =
    taxonomy?.kind === 'tipologia' ? taxonomy.value : (params.get('tipologia')?.trim() ?? '')
  const ambienteParam =
    taxonomy?.kind === 'ambiente' ? taxonomy.value : (params.get('ambiente')?.trim() ?? '')
  const stileParam =
    taxonomy?.kind === 'stile' ? taxonomy.value : (params.get('stile')?.trim() ?? '')
  const tagParam =
    taxonomy?.kind === 'tag' ? taxonomy.value : (params.get('tag')?.trim() ?? '')
  const wattaggioMin = wattaggioMinParam ? Number(wattaggioMinParam) : undefined
  const wattaggioMax = wattaggioMaxParam ? Number(wattaggioMaxParam) : undefined
  const wattaggioMinNum =
    wattaggioMin != null && Number.isFinite(wattaggioMin) ? wattaggioMin : undefined
  const wattaggioMaxNum =
    wattaggioMax != null && Number.isFinite(wattaggioMax) ? wattaggioMax : undefined
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

  const pageTitle = taxonomy ? taxonomyPageTitle(taxonomy) : undefined
  const pageSubtitle = taxonomy
    ? `Prodotti filtrati per ${taxonomy.hubLabel.toLowerCase()}.`
    : undefined
  const breadcrumbParent = taxonomy
    ? { label: taxonomy.hubLabel, href: taxonomy.hubPath }
    : undefined

  const products = useSnapshot(catalogStore).products
  const categories = useSnapshot(catalogStore).categories
  const brands = useSnapshot(catalogStore).brands
  const facets = useSnapshot(catalogStore).facets
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
        wattaggio: wattaggioParam || undefined,
        wattaggioMin: wattaggioMinNum,
        wattaggioMax: wattaggioMaxNum,
        tipologia: tipologiaParam || undefined,
        ambiente: ambienteParam || undefined,
        stile: stileParam || undefined,
        tag: tagParam || undefined,
        priceBucket: selectedPriceBucket,
        inStockOnly,
        q: queryParam || undefined,
        world: taxonomy ? undefined : worldTab,
        facets: facets as import('@/types/dto').CatalogFiltersDTO | null,
      }),
    [
      ambienteParam,
      attaccoParam,
      brandParam,
      brands,
      categories,
      categoryParam,
      colorTempParam,
      wattaggioParam,
      wattaggioMinNum,
      wattaggioMaxNum,
      facets,
      inStockOnly,
      queryParam,
      selectedPriceBucket,
      stileParam,
      tagParam,
      taxonomy,
      tipologiaParam,
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
      tipologia: tipologiaParam || undefined,
      ambiente: ambienteParam || undefined,
      stile: stileParam || undefined,
      tag: tagParam || undefined,
      world: clientWorld,
      q: effectiveQuery || undefined,
    })
  }, [
    initialProducts,
    locale,
    brandParam,
    effectiveCategory,
    attaccoParam,
    colorTempParam,
    tipologiaParam,
    ambienteParam,
    stileParam,
    tagParam,
    clientWorld,
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
    catalogStore.filters.tipologia = tipologiaParam || undefined
    catalogStore.filters.ambiente = ambienteParam || undefined
    catalogStore.filters.stile = stileParam || undefined
    catalogStore.filters.tag = tagParam || undefined
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
    tipologiaParam,
    ambienteParam,
    stileParam,
    tagParam,
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
      wattaggio: wattaggioParam || undefined,
      wattaggioMin: wattaggioMinNum != null ? String(wattaggioMinNum) : undefined,
      wattaggioMax: wattaggioMaxNum != null ? String(wattaggioMaxNum) : undefined,
      tipologia: tipologiaParam || undefined,
      ambiente: ambienteParam || undefined,
      stile: stileParam || undefined,
      tag: tagParam || undefined,
      world: clientWorld,
      sort: sortParam,
    })
    void fetchCatalogFilters({
      categorySlug: effectiveCategory,
      brandSlug: brandParam,
      q: effectiveQuery,
      attacco: attaccoParam || undefined,
      colorTemp: colorTempParam || undefined,
      wattaggio: wattaggioParam || undefined,
      wattaggioMin: wattaggioMinNum != null ? String(wattaggioMinNum) : undefined,
      wattaggioMax: wattaggioMaxNum != null ? String(wattaggioMaxNum) : undefined,
      world: clientWorld,
      locale,
    })
  }, [
    ambienteParam,
    attaccoParam,
    brandParam,
    clientWorld,
    colorTempParam,
    wattaggioParam,
    wattaggioMinNum,
    wattaggioMaxNum,
    effectiveCategory,
    effectiveQuery,
    locale,
    sortParam,
    stileParam,
    tagParam,
    tipologiaParam,
  ])

  useEffect(() => {
    catalogStore.filters.inStockOnly = inStockOnly
    catalogStore.filters.sort = sortParam
    catalogStore.filters.minPriceCents = minPrice
    catalogStore.filters.maxPriceCents = maxPrice
    catalogStore.filters.attacco = attaccoParam || undefined
    catalogStore.filters.colorTemp = colorTempParam || undefined
    catalogStore.filters.wattaggio = wattaggioParam || undefined
    catalogStore.filters.wattaggioMin =
      wattaggioMinNum != null ? String(wattaggioMinNum) : undefined
    catalogStore.filters.wattaggioMax =
      wattaggioMaxNum != null ? String(wattaggioMaxNum) : undefined
    catalogStore.filters.tipologia = tipologiaParam || undefined
    catalogStore.filters.ambiente = ambienteParam || undefined
    catalogStore.filters.stile = stileParam || undefined
    catalogStore.filters.tag = tagParam || undefined
    catalogStore.filters.world = clientWorld
    reapplyCatalogClientFilters()
  }, [
    ambienteParam,
    attaccoParam,
    clientWorld,
    colorTempParam,
    wattaggioParam,
    wattaggioMinNum,
    wattaggioMaxNum,
    inStockOnly,
    sortParam,
    minPrice,
    maxPrice,
    stileParam,
    tagParam,
    tipologiaParam,
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

  /** Dimensioni path-based: navigano alla tassonomia, non si accumulano in query. */
  function selectTaxonomyDimension(
    kind: CatalogTaxonomyKind,
    value: string | undefined,
    pathValue?: string,
  ) {
    if (!value) {
      if (taxonomy?.kind === kind) {
        router.push(lp(taxonomy.hubPath))
        return
      }
      updateFilterParam(kind === 'category' ? 'category' : kind, null)
      return
    }
    router.push(lp(taxonomyPath(kind, pathValue ?? value)))
  }

  function selectCategory(categorySlug?: string) {
    selectTaxonomyDimension('category', categorySlug)
  }

  function selectBrand(brandSlug?: string) {
    selectTaxonomyDimension('brand', brandSlug)
  }

  function selectTipologia(value?: string) {
    selectTaxonomyDimension('tipologia', value)
  }

  function selectAmbiente(value?: string) {
    selectTaxonomyDimension('ambiente', value)
  }

  function selectStile(value?: string) {
    selectTaxonomyDimension('stile', value)
  }

  function selectAttacco(value?: string) {
    selectTaxonomyDimension(
      'attacco',
      value,
      value ? attaccoPathSlugFromCode(value) : undefined,
    )
  }

  function selectColorTemp(value?: string) {
    updateFilterParam('colorTemp', value ?? null)
  }

  function selectWattaggioRange(range: { min?: number; max?: number }) {
    patchParams((next) => {
      next.delete('wattaggio')
      if (range.min != null) next.set('wattaggio_min', String(range.min))
      else next.delete('wattaggio_min')
      if (range.max != null) next.set('wattaggio_max', String(range.max))
      else next.delete('wattaggio_max')
    })
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
    if (taxonomy) {
      // Resta sull’URL tassonomia: azzera solo filtri secondari in query.
      patchParams((next) => {
        for (const key of [...next.keys()]) next.delete(key)
      })
      return
    }
    patchParams((next) => {
      next.delete('category')
      next.delete('brand')
      next.delete('q')
      next.delete('attacco')
      next.delete('colorTemp')
      next.delete('wattaggio')
      next.delete('wattaggio_min')
      next.delete('wattaggio_max')
      next.delete('tipologia')
      next.delete('ambiente')
      next.delete('stile')
      next.delete('tag')
      next.delete('priceBucket')
      next.delete('minPrice')
      next.delete('maxPrice')
      next.delete('inStock')
      next.delete('world')
      next.delete('sort')
    })
  }

  function removeFilter(key: string) {
    if (taxonomy && key === taxonomy.kind) {
      router.push(lp(taxonomy.hubPath))
      return
    }
    if (taxonomy && key === 'world') return
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
      case 'wattaggio':
        selectWattaggioRange({})
        break
      case 'tipologia':
        selectTipologia(undefined)
        break
      case 'ambiente':
        selectAmbiente(undefined)
        break
      case 'stile':
        selectStile(undefined)
        break
      case 'tag':
        updateFilterParam('tag', null)
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
        selectedTipologia={tipologiaParam || undefined}
        selectedAmbiente={ambienteParam || undefined}
        selectedStile={stileParam || undefined}
        selectedAttacco={attaccoParam || undefined}
        selectedColorTemp={colorTempParam || undefined}
        selectedWattaggioMin={wattaggioMinNum}
        selectedWattaggioMax={wattaggioMaxNum}
        selectedPriceBucket={selectedPriceBucket}
        inStockOnly={inStockOnly}
        facets={facets as import('@/types/dto').CatalogFiltersDTO | null}
        activeFilters={activeFilters}
        sort={sortParam}
        loadMoreRef={loadMoreRef}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
        onSelectCategory={selectCategory}
        onSelectBrand={selectBrand}
        onSelectTipologia={selectTipologia}
        onSelectAmbiente={selectAmbiente}
        onSelectStile={selectStile}
        onSelectAttacco={selectAttacco}
        onSelectColorTemp={selectColorTemp}
        onSelectWattaggioRange={selectWattaggioRange}
        onSelectPriceBucket={selectPriceBucket}
        onToggleInStock={toggleInStockOnly}
        onResetFilters={resetFilters}
        onRemoveFilter={removeFilter}
        onSelectSort={(sort) => updateFilterParam('sort', sort === 'relevance' ? null : sort)}
        onLoadMore={loadMore}
        emptyTitle={t('catalog.emptyTitle')}
        emptyDescription={t('catalog.emptyDescription')}
        searchQuery={queryParam}
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        breadcrumbParent={breadcrumbParent}
        showWorldTabs={!taxonomy}
      />
  )
}
