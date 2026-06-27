import {
  DEFAULT_DESIGN_CATEGORY_IT,
  DEFAULT_TECHNICAL_CATEGORY_IT,
} from '@/lib/category-landing.defaults'
import type { CategorySubtypeChip, CategoryTypeTile } from '@/types/category-landing'

export function getCatalogTypeTiles(): CategoryTypeTile[] {
  return DEFAULT_DESIGN_CATEGORY_IT.typeTiles ?? []
}

function chipQueryFromHref(href: string): string | undefined {
  const query = href.includes('?') ? href.split('?')[1] : ''
  return new URLSearchParams(query).get('q')?.trim().toLowerCase() || undefined
}

export function getCatalogSubtypeChips(searchQuery?: string): CategorySubtypeChip[] {
  const chips = DEFAULT_TECHNICAL_CATEGORY_IT.subtypeChips ?? []
  const q = searchQuery?.trim().toLowerCase() || undefined

  return chips.map((chip) => {
    if (!chip.href) {
      if (chip.label === 'Tutti') {
        return { ...chip, href: '/catalogo?world=technical', active: !q }
      }
      return chip
    }

    if (!chip.href.startsWith('/catalogo')) {
      return { ...chip, active: false }
    }

    const chipQ = chipQueryFromHref(chip.href)
    const active = chipQ ? chipQ === q : !q
    return { ...chip, active }
  })
}
