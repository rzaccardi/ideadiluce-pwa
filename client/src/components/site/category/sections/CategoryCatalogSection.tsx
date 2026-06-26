'use client'

import { useState } from 'react'
import type { ProductCardDTO } from '@/types/dto'
import type { CategoryLandingContent } from '@/types/category-landing'
import { cn } from '@/utils/cn'
import { CategoryLandingCatalogSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { SectionContainer } from '../../primitives'
import { CategoryFilterSidebar } from '../CategoryFilterSidebar'
import { CategoryResultsToolbar } from '../CategoryResultsToolbar'
import { DesignCatalogProductGrid } from '../DesignCatalogProductGrid'
import { TechnicalCatalogProductGrid } from '../TechnicalCatalogProductGrid'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  content: Pick<
    CategoryLandingContent,
    'filtersTitle' | 'filtersResetLabel' | 'filterGroups' | 'sortLabel' | 'sortValue' | 'loadMoreLabel'
  >
  products: ProductCardDTO[]
  totalCount?: number
  lp: LocalePathFn
  variant: 'design' | 'technical'
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

function activeFiltersFromContent(content: Props['content'], variant: 'design' | 'technical') {
  const filters: { label: string }[] = []
  for (const group of content.filterGroups) {
    for (const option of group.options) {
      if ('checked' in option && option.checked) filters.push({ label: option.label })
      if ('active' in option && option.active) filters.push({ label: option.label })
    }
  }
  if (variant === 'technical' && filters.length === 0) {
    return [{ label: 'LED' }, { label: '12V' }]
  }
  if (variant === 'design' && filters.length === 0) {
    return [{ label: 'Sospensione' }]
  }
  return filters.slice(0, 2)
}

export function CategoryCatalogSection({
  content,
  products,
  totalCount,
  lp,
  variant,
  loading,
  hasMore,
  onLoadMore,
}: Props) {
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const isDesign = variant === 'design'
  const activeFilters = activeFiltersFromContent(content, variant)

  const filterSidebarProps = {
    title: content.filtersTitle,
    resetLabel: content.filtersResetLabel,
    groups: content.filterGroups,
    variant,
  } as const

  return (
    <SectionContainer className="grid items-start gap-6 py-6 sm:py-8 lg:grid-cols-[248px_1fr] lg:gap-10 lg:py-10 xl:grid-cols-[264px_1fr]">
      <CategoryFilterSidebar {...filterSidebarProps} className="hidden lg:block" />

      <div className="min-w-0">
        <div className="mb-4 lg:hidden">
          <button
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-[14px] font-semibold',
              isDesign
                ? 'border-idl-path-design-border bg-white text-idl-ink'
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
                isDesign ? 'border-idl-path-design-border bg-white' : 'border-idl-tech-border bg-white',
              )}
            >
              <CategoryFilterSidebar {...filterSidebarProps} sticky={false} />
            </div>
          ) : null}
        </div>

        <CategoryResultsToolbar
          shownCount={products.length}
          totalCount={totalCount}
          activeFilters={activeFilters}
          sortLabel={content.sortLabel}
          sortValue={content.sortValue}
          variant={variant}
          compareEnabled={!isDesign}
        />

        {loading && products.length === 0 ? (
          <PageLoadTransition
            isLoading
            skeleton={<CategoryLandingCatalogSkeleton variant={variant} />}
          >
            {null}
          </PageLoadTransition>
        ) : isDesign ? (
          <DesignCatalogProductGrid products={products} lp={lp} />
        ) : (
          <TechnicalCatalogProductGrid products={products} lp={lp} />
        )}

        {isDesign && content.loadMoreLabel && hasMore ? (
          <div className="mt-7 text-center sm:mt-9">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setPage((p) => p + 1)
                onLoadMore?.()
              }}
              className="inline-block w-full rounded border border-idl-path-design-border px-8 py-3.5 text-[14.5px] font-semibold text-idl-ink transition hover:border-idl-brass hover:text-idl-brass disabled:opacity-60 sm:w-auto"
            >
              {content.loadMoreLabel}
            </button>
          </div>
        ) : null}

        {!isDesign && page >= 1 ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={
                  n === 1
                    ? 'flex size-9 items-center justify-center rounded-md bg-idl-ink text-[13.5px] font-bold text-white'
                    : 'flex size-9 items-center justify-center rounded-md border border-idl-tech-border text-[13.5px] font-semibold text-idl-graphite-2'
                }
              >
                {n}
              </span>
            ))}
            <span className="flex h-9 items-center rounded-md border border-idl-tech-border px-3 text-[13px] font-semibold text-idl-graphite-2 sm:px-3.5 sm:text-[13.5px]">
              <span className="sm:hidden">→</span>
              <span className="hidden sm:inline">Successivo →</span>
            </span>
          </div>
        ) : null}
      </div>
    </SectionContainer>
  )
}
