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
import { isCatalogWorldHubCategory } from '@/lib/catalog-filters'

export type CatalogDesignTypeNavContext = {
  selectedTipologia?: string
  selectedAmbiente?: string
  selectedStile?: string
  selectedCategorySlug?: string
  /** Route tassonomia path-based (/tipologia/…, /stile/…, …): mai hub base. */
  forcedTaxonomy?: boolean
}

export type CatalogTechnicalTypeNavContext = {
  selectedCategorySlug?: string
  selectedAttacco?: string
  /** Route tassonomia path-based (/attacco/…, /categoria-tecnica/…, …): mai hub base. */
  forcedTaxonomy?: boolean
}

/**
 * Hub catalogo arredo: niente tipologia/ambiente/stile né categoria foglia,
 * e non su landing tassonomia path-based.
 */
export function isDesignCatalogHub(ctx: CatalogDesignTypeNavContext = {}): boolean {
  if (ctx.forcedTaxonomy) return false
  if (ctx.selectedTipologia?.trim()) return false
  if (ctx.selectedAmbiente?.trim()) return false
  if (ctx.selectedStile?.trim()) return false
  return isCatalogWorldHubCategory(ctx.selectedCategorySlug, 'design')
}

/**
 * Hub catalogo tecnico: niente attacco né categoria foglia,
 * e non su landing tassonomia path-based.
 */
export function isTechnicalCatalogHub(ctx: CatalogTechnicalTypeNavContext = {}): boolean {
  if (ctx.forcedTaxonomy) return false
  if (ctx.selectedAttacco?.trim()) return false
  return isCatalogWorldHubCategory(ctx.selectedCategorySlug, 'technical')
}

/**
 * Tile tipologiche (Sospensione, Tavolo, …) solo sull’hub catalogo design.
 * Su `/tipologia/{slug}`, categorie foglia o altri filtri tassonomia: nascoste.
 */
export function getCatalogTypeTiles(
  facets?: CatalogFiltersDTO | null,
  options?: CatalogDesignTypeNavContext,
): CategoryTypeTile[] {
  if (!isDesignCatalogHub(options)) return []
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

/**
 * Chip sottotipi tecnici solo sull’hub catalogo tecnico.
 * Su categoria foglia / attacco / taxonomy path: nascoste.
 */
export function getCatalogSubtypeChips(
  searchQuery?: string,
  facets?: CatalogFiltersDTO | null,
  selectedCategorySlug?: string,
  options?: Omit<CatalogTechnicalTypeNavContext, 'selectedCategorySlug'>,
): CategorySubtypeChip[] {
  if (!isTechnicalCatalogHub({ selectedCategorySlug, ...options })) return []

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
