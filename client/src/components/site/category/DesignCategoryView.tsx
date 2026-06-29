'use client'

import { Reveal } from '@/components/motion'
import type { CatalogSort } from '@/features/catalog/catalog.store'
import type { CategoryLandingContent } from '@/types/category-landing'
import type { ProductCardDTO } from '@/types/dto'
import { CategoryCtaBanner } from './CategoryCtaBanner'
import { CategoryArticlesSection } from './CategoryArticlesSection'
import { CategoryGuideSection } from './CategoryGuideSection'
import {
  DesignCategoryHeroSection,
  DesignCategoryTypeGridSection,
} from './sections/DesignCategoryHeroSection'
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

export function DesignCategoryView({
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
        <DesignCategoryHeroSection content={content} lp={lp} />
      </Reveal>
      {content.typeTiles?.length ? (
        <Reveal>
          <DesignCategoryTypeGridSection tiles={content.typeTiles} lp={lp} />
        </Reveal>
      ) : null}
      <Reveal>
        <CategoryCatalogSection
          content={content}
          products={products}
          totalCount={totalCount}
          lp={lp}
          variant="design"
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
      {content.guide ? (
        <Reveal>
          <CategoryGuideSection section={content.guide} />
        </Reveal>
      ) : null}
      {content.articles?.items.length ? (
        <Reveal>
          <CategoryArticlesSection section={content.articles} lp={lp} />
        </Reveal>
      ) : null}
      <Reveal>
        <CategoryCtaBanner banner={content.cta} lp={lp} variant="design" />
      </Reveal>
    </div>
  )
}
