import type { CatalogFiltersDTO } from '@/types/dto'
import type { CategorySubtypeChip, CategoryTypeTile } from '@/types/category-landing'
import {
  DEFAULT_DESIGN_CATEGORY_IT,
  DEFAULT_TECHNICAL_CATEGORY_IT,
} from '@/lib/category-landing.defaults'
import {
  buildDesignTypeTilesFromFacets,
  buildTechnicalSubtypeChipsFromFacets,
} from '@/lib/catalog-facets-ui'

export function getCatalogTypeTiles(
  facets?: CatalogFiltersDTO | null,
): CategoryTypeTile[] {
  return buildDesignTypeTilesFromFacets(facets, DEFAULT_DESIGN_CATEGORY_IT.typeTiles ?? [])
}

function chipQueryFromHref(href: string): string | undefined {
  const query = href.includes('?') ? href.split('?')[1] : ''
  return new URLSearchParams(query).get('q')?.trim().toLowerCase() || undefined
}

function chipCategoryFromHref(href: string): string | undefined {
  const query = href.includes('?') ? href.split('?')[1] : ''
  return new URLSearchParams(query).get('category')?.trim().toLowerCase() || undefined
}

export function getCatalogSubtypeChips(
  searchQuery?: string,
  facets?: CatalogFiltersDTO | null,
  selectedCategorySlug?: string,
): CategorySubtypeChip[] {
  const fromFacets = buildTechnicalSubtypeChipsFromFacets(facets, {
    fallback: [],
    catalogMode: true,
    selectedCategorySlug,
  })
  if (fromFacets.length) return fromFacets

  const chips = DEFAULT_TECHNICAL_CATEGORY_IT.subtypeChips ?? []
  const q = searchQuery?.trim().toLowerCase() || undefined
  const selected = selectedCategorySlug?.trim().toLowerCase()

  return chips.map((chip) => {
    if (!chip.href) {
      if (chip.label === 'Tutti') {
        return { ...chip, href: '/negozio?world=technical', active: !q && !selected }
      }
      return chip
    }

    if (!chip.href.startsWith('/negozio')) {
      return { ...chip, active: false }
    }

    const chipCategory = chipCategoryFromHref(chip.href)
    if (chipCategory) {
      return { ...chip, active: chipCategory === selected }
    }

    const chipQ = chipQueryFromHref(chip.href)
    const active = chipQ ? chipQ === q : !q && !selected
    return { ...chip, active }
  })
}
