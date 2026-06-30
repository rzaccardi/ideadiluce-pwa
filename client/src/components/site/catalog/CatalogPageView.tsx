'use client'

import { useMemo, useState } from 'react'
import type { CategoryDTO, ProductCardDTO } from '@/types/dto'
import type { BrandListItemDTO } from '@/types/site-content'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import type { CatalogActiveFilter, CatalogPriceBucket, CatalogWorldTab } from '@/lib/catalog-filters'
import { TechnicalCatalogSelectionProvider } from '@/context/technical-catalog-selection-context'
import { SectionContainer } from '../primitives'
import { CatalogHeroSection } from './CatalogHeroSection'
import { CatalogFilterSidebar } from './CatalogFilterSidebar'
import { CatalogActiveFiltersBar } from './CatalogActiveFiltersBar'
import { CatalogCategoryNavSection } from './CatalogCategoryNavSection'
import { CatalogProductGrid } from './CatalogProductGrid'
import { ToastOnError } from '@/components/ToastFeedback'
import { EmptyState } from '@/components/EmptyState'
import type { LocalePathFn } from '../sections/types'
import { cn } from '@/utils/cn'
import { CatalogFiltersSkeleton, ProductGridSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { CatalogLoadMoreFooter } from './CatalogLoadMoreFooter'
import dynamic from 'next/dynamic'
import { CatalogMobileToolbar } from './CatalogMobileToolbar'
import { TechnicalCatalogBulkBar } from '../category/TechnicalCatalogBulkBar'

const CatalogFiltersModal = dynamic(
  () => import('./CatalogFiltersModal').then((m) => ({ default: m.CatalogFiltersModal })),
  { ssr: false },
)
import { TechnicalCatalogSelectionToggle } from '../category/TechnicalCatalogSelectionToggle'
import { useTechnicalCatalogSelectionContext } from '@/context/technical-catalog-selection-context'
import { resolveProductCardCatalogKind } from '@/lib/product-catalog-kind'

type Props = {
  lp: LocalePathFn
  error: string | null
  isLoading: boolean
  isLoadingMore: boolean
  pendingSkeletonCount: number
  products: ReadonlyArray<ProductCardDTO>
  categories: ReadonlyArray<CategoryDTO>
  brands: ReadonlyArray<BrandListItemDTO>
  totalProducts: number
  shownProducts: number
  hasMore: boolean
  worldTab: CatalogWorldTab
  designLabel: string
  technicalLabel: string
  filtersOpen: boolean
  rootCategories: ReadonlyArray<CategoryDTO>
  subcategories: ReadonlyArray<CategoryDTO>
  selectedCategorySlug?: string
  selectedBrandSlug?: string
  selectedAttacco?: string
  selectedColorTemp?: string
  selectedPriceBucket?: CatalogPriceBucket
  inStockOnly: boolean
  activeFilters: ReadonlyArray<CatalogActiveFilter>
  sort: CatalogSort
  loadMoreRef: React.RefObject<HTMLDivElement | null>
  onToggleFilters: () => void
  onSelectCategory: (slug?: string) => void
  onSelectBrand: (slug?: string) => void
  onSelectAttacco: (value?: string) => void
  onSelectColorTemp: (value?: string) => void
  onSelectPriceBucket: (value?: CatalogPriceBucket) => void
  onToggleInStock: (enabled: boolean) => void
  onResetFilters: () => void
  onRemoveFilter: (key: string) => void
  onSelectSort: (sort: CatalogSort) => void
  onLoadMore: () => void
  emptyTitle: string
  emptyDescription: string
  searchQuery?: string
}

function CatalogGridSkeleton({
  filtersOpen,
  worldTab,
}: {
  filtersOpen: boolean
  worldTab: CatalogWorldTab
}) {
  const cols =
    worldTab === 'technical'
      ? 'grid-cols-2 xl:grid-cols-3'
      : filtersOpen
        ? 'grid-cols-2 xl:grid-cols-3'
        : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  return <ProductGridSkeleton count={8} className={cols} />
}

function CatalogTechnicalSelectionToggleRow() {
  const selection = useTechnicalCatalogSelectionContext()
  if (!selection) return null

  return (
    <div className="mb-4 flex justify-end lg:hidden">
      <TechnicalCatalogSelectionToggle
        enabled={selection.selectionEnabled}
        onChange={selection.setSelectionMode}
      />
    </div>
  )
}

function CatalogTechnicalSelectionToolbar() {
  const selection = useTechnicalCatalogSelectionContext()
  if (!selection) return null

  return (
    <div className="mb-4 hidden justify-end lg:flex">
      <TechnicalCatalogSelectionToggle
        enabled={selection.selectionEnabled}
        onChange={selection.setSelectionMode}
      />
    </div>
  )
}

function CatalogProductResults({
  products,
  categories,
  lp,
  worldTab,
  filtersOpen,
  pendingSkeletonCount,
  isLoading,
}: {
  products: ReadonlyArray<ProductCardDTO>
  categories: ReadonlyArray<CategoryDTO>
  lp: LocalePathFn
  worldTab: CatalogWorldTab
  filtersOpen: boolean
  pendingSkeletonCount: number
  isLoading: boolean
}) {
  const supportsSelection = worldTab === 'technical' || worldTab === 'all'
  const selectableProducts = useMemo(
    () =>
      worldTab === 'technical'
        ? products
        : products.filter((product) => resolveProductCardCatalogKind(product) === 'technical'),
    [products, worldTab],
  )
  const grid = (
    <>
      {supportsSelection ? <CatalogTechnicalSelectionToggleRow /> : null}
      {pendingSkeletonCount > 0 ? (
        <p className="sr-only" role="status" aria-live="polite">
          Caricamento di altri {pendingSkeletonCount} prodotti
        </p>
      ) : null}
      <div
        className={cn(
          'transition-opacity duration-200',
          isLoading && products.length > 0 && 'pointer-events-none opacity-60',
        )}
      >
        <CatalogProductGrid
          products={products}
          categories={categories}
          lp={lp}
          worldTab={worldTab}
          filtersOpen={filtersOpen}
          pendingSkeletonCount={pendingSkeletonCount}
        />
      </div>
    </>
  )

  if (!supportsSelection) {
    return grid
  }

  return (
    <TechnicalCatalogSelectionProvider products={selectableProducts}>
      <CatalogTechnicalSelectionToolbar />
      {grid}
      <TechnicalCatalogBulkBar products={selectableProducts} lp={lp} />
    </TechnicalCatalogSelectionProvider>
  )
}

export function CatalogPageView({
  lp,
  error,
  isLoading,
  isLoadingMore,
  pendingSkeletonCount,
  products,
  categories,
  brands,
  totalProducts,
  shownProducts,
  hasMore,
  worldTab,
  designLabel,
  technicalLabel,
  filtersOpen,
  rootCategories,
  subcategories,
  selectedCategorySlug,
  selectedBrandSlug,
  selectedAttacco,
  selectedColorTemp,
  selectedPriceBucket,
  inStockOnly,
  activeFilters,
  sort,
  loadMoreRef,
  onToggleFilters,
  onSelectCategory,
  onSelectBrand,
  onSelectAttacco,
  onSelectColorTemp,
  onSelectPriceBucket,
  onToggleInStock,
  onResetFilters,
  onRemoveFilter,
  onSelectSort,
  onLoadMore,
  emptyTitle,
  emptyDescription,
  searchQuery,
}: Props) {
  const [filtersModalOpen, setFiltersModalOpen] = useState(false)

  const sidebarProps = {
    rootCategories,
    subcategories,
    brands,
    selectedCategorySlug,
    selectedBrandSlug,
    selectedAttacco,
    selectedColorTemp,
    selectedPriceBucket,
    inStockOnly,
    onSelectCategory,
    onSelectBrand,
    onSelectAttacco,
    onSelectColorTemp,
    onSelectPriceBucket,
    onToggleInStock,
    onReset: onResetFilters,
  }

  return (
    <div className="bg-idl-tech-panel">
      <CatalogHeroSection
        lp={lp}
        totalProducts={totalProducts}
        worldTab={worldTab}
        designLabel={designLabel}
        technicalLabel={technicalLabel}
        searchQuery={searchQuery}
        afterSearch={
          <CatalogMobileToolbar
            activeFilterCount={activeFilters.length}
            sort={sort}
            onOpenFilters={() => setFiltersModalOpen(true)}
            onSelectSort={onSelectSort}
          />
        }
      />

      {filtersModalOpen ? (
        <CatalogFiltersModal
          open={filtersModalOpen}
          onClose={() => setFiltersModalOpen(false)}
          totalProducts={totalProducts}
          {...sidebarProps}
        />
      ) : null}

      <CatalogCategoryNavSection lp={lp} worldTab={worldTab} searchQuery={searchQuery} />

      <SectionContainer className="py-6 sm:py-8 lg:py-10">
        <div
          className={cn(
            'grid items-start gap-6 lg:gap-8',
            filtersOpen ? 'lg:grid-cols-[256px_1fr]' : 'lg:grid-cols-1',
          )}
        >
          {filtersOpen ? (
            <div className="hidden lg:block">
              <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-auto rounded-[14px] border border-idl-tech-border bg-idl-tech-panel p-5">
                <CatalogFilterSidebar {...sidebarProps} />
              </div>
            </div>
          ) : null}

          <div className="min-w-0">
            <CatalogActiveFiltersBar
              filtersOpen={filtersOpen}
              onToggleFilters={onToggleFilters}
              activeFilters={activeFilters}
              sort={sort}
              onSelectSort={onSelectSort}
              onRemoveFilter={onRemoveFilter}
              onResetFilters={onResetFilters}
            />

            <ToastOnError message={error} />

            {isLoading && products.length === 0 ? (
              <PageLoadTransition
                isLoading
                skeleton={
                  <div className="space-y-4">
                    <CatalogFiltersSkeleton />
                    <CatalogGridSkeleton filtersOpen={filtersOpen} worldTab={worldTab} />
                  </div>
                }
              >
                {null}
              </PageLoadTransition>
            ) : products.length === 0 ? (
              <EmptyState title={emptyTitle} description={emptyDescription} />
            ) : (
              <>
                <CatalogProductResults
                  products={products}
                  categories={categories}
                  lp={lp}
                  worldTab={worldTab}
                  filtersOpen={filtersOpen}
                  pendingSkeletonCount={pendingSkeletonCount}
                  isLoading={isLoading}
                />

                <div ref={loadMoreRef} className="h-px" aria-hidden />

                <CatalogLoadMoreFooter
                  shownProducts={shownProducts}
                  totalProducts={totalProducts}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                  onLoadMore={onLoadMore}
                  variant="catalog"
                />
              </>
            )}
          </div>
        </div>
      </SectionContainer>
    </div>
  )
}
