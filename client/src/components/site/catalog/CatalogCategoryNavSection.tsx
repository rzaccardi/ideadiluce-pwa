'use client'

import type { CatalogWorldTab } from '@/lib/catalog-filters'
import { getCatalogSubtypeChips, getCatalogTypeTiles } from '@/lib/catalog-category-nav'
import type { CatalogFiltersDTO } from '@/types/dto'
import { DesignCategoryTypeGridSection } from '../category/sections/DesignCategoryHeroSection'
import { TechnicalCategorySubtypeSection } from '../category/sections/TechnicalCategoryHeroSection'
import type { LocalePathFn } from '../sections/types'

type Props = {
  lp: LocalePathFn
  worldTab: CatalogWorldTab
  searchQuery?: string
  selectedCategorySlug?: string
  facets?: CatalogFiltersDTO | null | Readonly<CatalogFiltersDTO>
}

export function CatalogCategoryNavSection({
  lp,
  worldTab,
  searchQuery,
  selectedCategorySlug,
  facets,
}: Props) {
  if (worldTab === 'design') {
    const tiles = getCatalogTypeTiles(facets)
    if (tiles.length === 0) return null
    return <DesignCategoryTypeGridSection tiles={tiles} lp={lp} />
  }

  if (worldTab === 'technical') {
    const chips = getCatalogSubtypeChips(searchQuery, facets, selectedCategorySlug)
    if (chips.length === 0) return null
    return <TechnicalCategorySubtypeSection chips={chips} lp={lp} />
  }

  return null
}
