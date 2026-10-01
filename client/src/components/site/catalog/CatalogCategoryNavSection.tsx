'use client'

import type { CatalogWorldTab } from '@/lib/catalog-filters'
import { getCatalogSubtypeChips, getCatalogTypeTiles } from '@/lib/catalog-category-nav'
import { translateCatalogTaxonomyLabel } from '@/lib/catalog-taxonomy-i18n'
import type { CatalogFiltersDTO } from '@/types/dto'
import { useI18n } from '@/hooks/use-i18n'
import { DesignCategoryTypeGridSection } from '../category/sections/DesignCategoryHeroSection'
import { TechnicalCategorySubtypeSection } from '../category/sections/TechnicalCategoryHeroSection'
import type { LocalePathFn } from '../sections/types'

type Props = {
  lp: LocalePathFn
  worldTab: CatalogWorldTab
  searchQuery?: string
  selectedCategorySlug?: string
  selectedTipologia?: string
  selectedAmbiente?: string
  selectedStile?: string
  selectedAttacco?: string
  /** Route tassonomia path-based: nasconde nav tipologica (mai hub base). */
  forcedTaxonomy?: boolean
  facets?: CatalogFiltersDTO | null | Readonly<CatalogFiltersDTO>
}

export function CatalogCategoryNavSection({
  lp,
  worldTab,
  searchQuery,
  selectedCategorySlug,
  selectedTipologia,
  selectedAmbiente,
  selectedStile,
  selectedAttacco,
  forcedTaxonomy,
  facets,
}: Props) {
  const { t } = useI18n()

  if (worldTab === 'design') {
    const tiles = getCatalogTypeTiles(facets, {
      selectedTipologia,
      selectedAmbiente,
      selectedStile,
      selectedCategorySlug,
      forcedTaxonomy,
    }).map((tile) => ({
      ...tile,
      label: translateCatalogTaxonomyLabel(tile.key, t, tile.label),
    }))
    if (tiles.length === 0) return null
    return <DesignCategoryTypeGridSection tiles={tiles} lp={lp} />
  }

  if (worldTab === 'technical') {
    const chips = getCatalogSubtypeChips(searchQuery, facets, selectedCategorySlug, {
      selectedAttacco,
      forcedTaxonomy,
    }).map((chip) => {
      const slugFromHref =
        chip.href && chip.href.includes('category=')
          ? new URLSearchParams(chip.href.split('?')[1] ?? '').get('category') ?? undefined
          : undefined
      return {
        ...chip,
        label: translateCatalogTaxonomyLabel(slugFromHref ?? chip.label, t, chip.label),
      }
    })
    if (chips.length === 0) return null
    return <TechnicalCategorySubtypeSection chips={chips} lp={lp} />
  }

  return null
}
