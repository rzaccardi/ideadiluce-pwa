'use client'

import { useCallback, useState } from 'react'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import type { ProductCardDTO } from '@/types/dto'
import type { CategoryLandingContent } from '@/types/category-landing'
import { cn } from '@/utils/cn'
import { CategoryLandingCatalogSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { CatalogLoadMoreFooter } from '@/components/site/catalog/CatalogLoadMoreFooter'
import { CatalogEmptyAlternatives } from '@/components/catalog/CatalogEmptyAlternatives'
import { SectionContainer } from '../../primitives'
import { CategoryFilterSidebar } from '../CategoryFilterSidebar'
import { CategoryResultsToolbar } from '../CategoryResultsToolbar'
import { DesignCatalogProductGrid } from '../DesignCatalogProductGrid'
import { TechnicalCatalogSelectionProvider } from '@/context/technical-catalog-selection-context'
import { TechnicalCatalogBulkBar } from '../TechnicalCatalogBulkBar'
import { TechnicalCatalogProductGrid } from '../TechnicalCatalogProductGrid'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  content: Pick<
    CategoryLandingContent,
    'filtersTitle' | 'filtersResetLabel' | 'filterGroups' | 'sortLabel' | 'sortValue' | 'loadMoreLabel'
  >
  products: ReadonlyArray<ProductCardDTO>
  totalCount?: number
  lp: LocalePathFn
  variant: 'design' | 'technical'
  loading?: boolean
  isLoadingMore?: boolean
  pendingSkeletonCount?: number
  hasMore?: boolean
  onLoadMore?: () => void
  selectedFilterValues: ReadonlySet<string>
  activeFilters: ReadonlyArray<{ key: string; label: string }>
  sort: CatalogSort
  onToggleFilter: (value: string) => void
  onResetFilters: () => void
  onRemoveFilter: (key: string) => void
  onSelectSort: (sort: CatalogSort) => void
  wattaggioValues?: ReadonlyArray<number>
  wattaggioMin?: number
  wattaggioMax?: number
  onSelectWattaggioRange?: (range: { min?: number; max?: number }) => void
}

export function CategoryCatalogSection({
  content,
  products,
  totalCount,
  lp,
  variant,
  loading,
  isLoadingMore = false,
  pendingSkeletonCount = 0,
  hasMore = false,
  onLoadMore,
  selectedFilterValues,
  activeFilters,
  sort,
  onToggleFilter,
  onResetFilters,
  onRemoveFilter,
  onSelectSort,
  wattaggioValues,
  wattaggioMin,
  wattaggioMax,
  onSelectWattaggioRange,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const isDesign = variant === 'design'

  const loadMore = useCallback(() => {
    onLoadMore?.()
  }, [onLoadMore])

  const loadMoreRef = useInfiniteScrollSentinel({
    hasMore,
    loading: Boolean(loading) || isLoadingMore,
    onLoadMore: loadMore,
  })

  const filterSidebarProps = {
    title: content.filtersTitle,
    resetLabel: content.filtersResetLabel,
    groups: content.filterGroups,
    selectedValues: selectedFilterValues,
    onToggleValue: onToggleFilter,
    onReset: onResetFilters,
    variant,
    wattaggioValues,
    wattaggioMin,
    wattaggioMax,
    onSelectWattaggioRange,
  } as const

  return (
    <SectionContainer className="grid items-start gap-6 py-6 sm:py-8 lg:grid-cols-[248px_1fr] lg:gap-10 lg:py-10 xl:grid-cols-[264px_1fr]">
      <CategoryFilterSidebar {...filterSidebarProps} sticky={false} className="hidden lg:block" />

      <div className="min-w-0">
        <div className="mb-4 lg:hidden">
          <button
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-[14px] font-semibold',
              isDesign
                ? 'border-idl-path-design-border bg-idl-tech-panel text-idl-ink'
                : 'border-idl-tech-border bg-idl-tech-panel text-idl-ink',
            )}
          >
            <span>{content.filtersTitle}</span>
            <span className="text-idl-muted">{filtersOpen ? '▴' : '▾'}</span>
          </button>
          {filtersOpen ? (
            <div
              className={cn(
                'mt-3 rounded-lg border p-4',
                isDesign ? 'border-idl-path-design-border bg-idl-tech-panel' : 'border-idl-tech-border bg-idl-tech-panel',
              )}
            >
              <CategoryFilterSidebar {...filterSidebarProps} sticky={false} />
            </div>
          ) : null}
        </div>

        {isDesign ? (
          <>
            <CategoryResultsToolbar
              shownCount={products.length}
              totalCount={totalCount}
              loading={loading}
              activeFilters={activeFilters}
              sortLabel={content.sortLabel}
              sortValue={content.sortValue}
              sort={sort}
              onSelectSort={onSelectSort}
              onRemoveFilter={onRemoveFilter}
              variant={variant}
            />

            {loading && products.length === 0 ? (
              <PageLoadTransition
                isLoading
                skeleton={<CategoryLandingCatalogSkeleton variant={variant} />}
              >
                {null}
              </PageLoadTransition>
            ) : (
              <div
                className={cn(
                  'transition-opacity duration-200',
                  loading && products.length > 0 && 'pointer-events-none opacity-60',
                )}
              >
                <DesignCatalogProductGrid
                  products={products}
                  lp={lp}
                  pendingSkeletonCount={pendingSkeletonCount}
                />
                {products.length === 0 && pendingSkeletonCount === 0 ? (
                  <CatalogEmptyAlternatives className="mt-2" />
                ) : null}
              </div>
            )}
          </>
        ) : (
          <TechnicalCatalogSelectionProvider products={products}>
            <CategoryResultsToolbar
              shownCount={products.length}
              totalCount={totalCount}
              loading={loading}
              activeFilters={activeFilters}
              sortLabel={content.sortLabel}
              sortValue={content.sortValue}
              sort={sort}
              onSelectSort={onSelectSort}
              onRemoveFilter={onRemoveFilter}
              variant={variant}
            />

            {loading && products.length === 0 ? (
              <PageLoadTransition
                isLoading
                skeleton={<CategoryLandingCatalogSkeleton variant={variant} />}
              >
                {null}
              </PageLoadTransition>
            ) : (
              <div
                className={cn(
                  'transition-opacity duration-200',
                  loading && products.length > 0 && 'pointer-events-none opacity-60',
                )}
              >
                <TechnicalCatalogProductGrid
                  products={products}
                  lp={lp}
                  pendingSkeletonCount={pendingSkeletonCount}
                />
                {products.length === 0 && pendingSkeletonCount === 0 ? (
                  <CatalogEmptyAlternatives className="mt-2" />
                ) : null}
              </div>
            )}

            <TechnicalCatalogBulkBar products={products} />
          </TechnicalCatalogSelectionProvider>
        )}

        <div ref={loadMoreRef} className="h-px" aria-hidden />

        {!loading || products.length > 0 ? (
          <CatalogLoadMoreFooter
            shownProducts={products.length}
            totalProducts={totalCount ?? products.length}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            loadMoreLabel={content.loadMoreLabel}
            variant={variant}
          />
        ) : null}
      </div>
    </SectionContainer>
  )
}
