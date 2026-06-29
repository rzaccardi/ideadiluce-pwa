'use client'

import { Reveal } from '@/components/motion'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import type { CategoryLandingContent } from '@/types/category-landing'
import type { ProductCardDTO } from '@/types/dto'
import { CategoryCtaBanner } from './CategoryCtaBanner'
import { CategoryTipsSection } from './CategoryTipsSection'
import {
  TechnicalCategoryHeroSection,
  TechnicalCategorySubtypeSection,
} from './sections/TechnicalCategoryHeroSection'
import { CategoryCatalogSection } from './sections/CategoryCatalogSection'
import type { LocalePathFn } from '../sections/types'

type CatalogSectionProps = {
  content: CategoryLandingContent
  products: ReadonlyArray<ProductCardDTO>
  totalCount?: number
  loading?: boolean
  isLoadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  selectedFilterValues: ReadonlySet<string>
  activeFilters: ReadonlyArray<{ key: string; label: string }>
  sort: CatalogSort
  onToggleFilter: (value: string) => void
  onResetFilters: () => void
  onRemoveFilter: (key: string) => void
  onSelectSort: (sort: CatalogSort) => void
  lp: LocalePathFn
}

export function TechnicalCategoryView({
  content,
  products,
  totalCount,
  loading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  selectedFilterValues,
  activeFilters,
  sort,
  onToggleFilter,
  onResetFilters,
  onRemoveFilter,
  onSelectSort,
  lp,
}: CatalogSectionProps) {
  return (
    <div className="bg-idl-tech-panel">
      <Reveal immediate>
        <TechnicalCategoryHeroSection content={content} lp={lp} />
      </Reveal>
      {content.subtypeChips?.length ? (
        <Reveal>
          <TechnicalCategorySubtypeSection chips={content.subtypeChips} lp={lp} />
        </Reveal>
      ) : null}
      <Reveal>
        <CategoryCatalogSection
          content={content}
          products={products}
          totalCount={totalCount}
          lp={lp}
          variant="technical"
          loading={loading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          selectedFilterValues={selectedFilterValues}
          activeFilters={activeFilters}
          sort={sort}
          onToggleFilter={onToggleFilter}
          onResetFilters={onResetFilters}
          onRemoveFilter={onRemoveFilter}
          onSelectSort={onSelectSort}
        />
      </Reveal>
      {content.tips ? (
        <Reveal>
          <CategoryTipsSection section={content.tips} />
        </Reveal>
      ) : null}
      <Reveal>
        <CategoryCtaBanner banner={content.cta} lp={lp} variant="technical" />
      </Reveal>
    </div>
  )
}
