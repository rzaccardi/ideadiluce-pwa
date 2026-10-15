export type SiteNavFilterKind =
  | 'category'
  | 'tag'
  | 'brand'
  | 'attacco'
  | 'tipologia'
  | 'stile'
  | 'ambiente'

export type SiteNavFilterWorld = 'design' | 'technical'

export type MegaMenuLink = {
  label: string
  href: string
  imageUrl?: string
  videoUrl?: string
  filterKind?: SiteNavFilterKind
  filterValue?: string
  filterWorld?: SiteNavFilterWorld
}

export type MegaMenuColumn = {
  title: string
  links: MegaMenuLink[]
}

export type MegaMenuPanel = {
  columns: MegaMenuColumn[]
  eyebrow?: string
  allSocketsCta?: string
  promo?: {
    title: string
    description: string
    ctaLabel: string
    ctaHref: string
    variant: 'design' | 'technical'
  }
}

export const SITE_NAV_FILTER_KINDS: ReadonlyArray<{ value: SiteNavFilterKind; label: string }> = [
  { value: 'category', label: 'Categoria' },
  { value: 'tag', label: 'Tag' },
  { value: 'brand', label: 'Brand' },
  { value: 'attacco', label: 'Attacco' },
  { value: 'tipologia', label: 'Tipologia' },
  { value: 'stile', label: 'Stile' },
  { value: 'ambiente', label: 'Ambiente' },
]

export function filterKindLabel(kind: SiteNavFilterKind): string {
  return SITE_NAV_FILTER_KINDS.find((item) => item.value === kind)?.label ?? kind
}

export function isFilterPinnedLink(link: MegaMenuLink): boolean {
  return Boolean(link.filterKind && link.filterValue?.trim())
}

export function buildNavFilterHref(
  kind: SiteNavFilterKind,
  rawValue: string,
  world?: SiteNavFilterWorld,
): string {
  const value = rawValue.trim()
  if (!value) return '/negozio'

  switch (kind) {
    case 'category':
      if (world === 'design') return `/negozio?world=design&category=${encodeURIComponent(value)}`
      return `/categoria-tecnica/${encodeURIComponent(value)}`
    case 'tag': {
      const params = new URLSearchParams()
      if (world) params.set('world', world)
      params.set('tag', value)
      return `/negozio?${params.toString()}`
    }
    case 'brand':
      return `/brand/${encodeURIComponent(value)}`
    case 'attacco':
      return `/attacco/${encodeURIComponent(value.toLowerCase())}`
    case 'tipologia':
      return `/tipologia/${encodeURIComponent(value.toLowerCase())}`
    case 'stile':
      return `/stile/${encodeURIComponent(value.toLowerCase())}`
    case 'ambiente':
      return `/ambienti/${encodeURIComponent(value.toLowerCase())}`
  }
}

export type CatalogFilterOption = {
  value: string
  label: string
  count: number
}

export type CatalogFiltersAdminDTO = {
  categories: Array<{
    slug: string
    name: string
    count: number
    children?: CatalogFiltersAdminDTO['categories']
  }>
  brands: Array<{ slug: string; name: string; count: number }>
  tags: CatalogFilterOption[]
  attacchi: CatalogFilterOption[]
  tipologie: CatalogFilterOption[]
  stili: CatalogFilterOption[]
  ambienti: CatalogFilterOption[]
}

function flattenCategories(
  nodes: CatalogFiltersAdminDTO['categories'],
  out: CatalogFilterOption[] = [],
): CatalogFilterOption[] {
  for (const node of nodes) {
    out.push({ value: node.slug, label: node.name, count: node.count })
    if (node.children?.length) flattenCategories(node.children, out)
  }
  return out
}

export function optionsForFilterKind(
  filters: CatalogFiltersAdminDTO | null,
  kind: SiteNavFilterKind,
): CatalogFilterOption[] {
  if (!filters) return []
  switch (kind) {
    case 'category':
      return flattenCategories(filters.categories).sort((a, b) => b.count - a.count)
    case 'brand':
      return filters.brands
        .map((b) => ({ value: b.slug, label: b.name, count: b.count }))
        .sort((a, b) => b.count - a.count)
    case 'tag':
      return [...filters.tags].sort((a, b) => b.count - a.count)
    case 'attacco':
      return [...filters.attacchi].sort((a, b) => b.count - a.count)
    case 'tipologia':
      return [...filters.tipologie].sort((a, b) => b.count - a.count)
    case 'stile':
      return [...filters.stili].sort((a, b) => b.count - a.count)
    case 'ambiente':
      return [...filters.ambienti].sort((a, b) => b.count - a.count)
  }
}

export function defaultWorldForMenu(menuId: string): SiteNavFilterWorld {
  return menuId === 'arredo' ? 'design' : 'technical'
}
