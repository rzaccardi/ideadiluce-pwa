'use client'

import type { CatalogWorldTab } from '@/lib/catalog-filters'
import { getCatalogSubtypeChips, getCatalogTypeTiles } from '@/lib/catalog-category-nav'
import { DesignCategoryTypeGridSection } from '../category/sections/DesignCategoryHeroSection'
import { TechnicalCategorySubtypeSection } from '../category/sections/TechnicalCategoryHeroSection'
import type { LocalePathFn } from '../sections/types'

type Props = {
  lp: LocalePathFn
  worldTab: CatalogWorldTab
  searchQuery?: string
}

export function CatalogCategoryNavSection({ lp, worldTab, searchQuery }: Props) {
  if (worldTab === 'design') {
    const tiles = getCatalogTypeTiles()
    if (tiles.length === 0) return null
    return <DesignCategoryTypeGridSection tiles={tiles} lp={lp} />
  }

  if (worldTab === 'technical') {
    const chips = getCatalogSubtypeChips(searchQuery)
    if (chips.length === 0) return null
    return <TechnicalCategorySubtypeSection chips={chips} lp={lp} />
  }

  return null
}
