'use client'

import type { CategoryDTO, ProductCardDTO } from '@/types/dto'
import type { BrandListItemDTO } from '@/types/site-content'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import type { CatalogActiveFilter, CatalogPriceBucket, CatalogWorldTab } from '@/lib/catalog-filters'
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

type Props = {
  lp: LocalePathFn
  error: string | null
  isLoading: boolean
  isLoadingMore: boolean
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
  onSelectWorldTab: (tab: CatalogWorldTab) => void
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

export function CatalogPageView({
  lp,
  error,
  isLoading,
  isLoadingMore,
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
  onSelectWorldTab,
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
        onSelectTab={onSelectWorldTab}
      />

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
              <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-auto rounded-[14px] border border-idl-tech-border bg-white p-5">
                <CatalogFilterSidebar {...sidebarProps} />
              </div>
            </div>
          ) : null}

          <div className="min-w-0">
            {filtersOpen ? (
              <div className="mb-4 lg:hidden">
                <div className="rounded-[14px] border border-idl-tech-border bg-white p-4">
                  <CatalogFilterSidebar {...sidebarProps} />
                </div>
              </div>
            ) : null}

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
                <CatalogProductGrid
                  products={products}
                  categories={categories}
                  lp={lp}
                  worldTab={worldTab}
                  filtersOpen={filtersOpen}
                />

                {isLoadingMore ? (
                  <div className="mt-4">
                    <CatalogGridSkeleton filtersOpen={filtersOpen} worldTab={worldTab} />
                  </div>
                ) : null}

                <CatalogLoadMoreFooter
                  shownProducts={shownProducts}
                  totalProducts={totalProducts}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                  loadMoreRef={loadMoreRef}
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
