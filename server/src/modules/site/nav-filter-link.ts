import type { CatalogFiltersDTO } from '../catalog/catalog-odoo-search.service.js'
import { canonicalizeBrandSlug } from '../catalog/odoo-catalog-slug.js'
import type { SiteLink, SiteNavFilterKind, SiteShellContent } from './site.types.js'

/** Alias slug CMS ↔ slug search Odoo (categorie tecniche). */
const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  alogena: 'alogene',
  fluorescenza: 'fluorescente',
  'lampade-scarica': 'scarica',
  'lampada-scarica': 'scarica',
}

function canonicalizeCategorySlug(slug: string): string {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return normalized
  return CATEGORY_SLUG_ALIASES[normalized] ?? normalized
}

export const SITE_NAV_FILTER_KINDS = [
  'category',
  'tag',
  'brand',
  'attacco',
  'tipologia',
  'stile',
  'ambiente',
] as const satisfies ReadonlyArray<SiteNavFilterKind>

export const SITE_NAV_FILTER_KIND_LABELS: Record<SiteNavFilterKind, string> = {
  category: 'Categoria',
  tag: 'Tag',
  brand: 'Brand',
  attacco: 'Attacco',
  tipologia: 'Tipologia',
  stile: 'Stile',
  ambiente: 'Ambiente',
}

export function isSiteNavFilterKind(value: unknown): value is SiteNavFilterKind {
  return typeof value === 'string' && (SITE_NAV_FILTER_KINDS as readonly string[]).includes(value)
}

export function isFilterPinnedLink(link: SiteLink): boolean {
  return Boolean(link.filterKind && link.filterValue?.trim())
}

/** Href canonico per un pin di filtro catalogo (mai query testuale `q=`). */
export function buildNavFilterHref(
  kind: SiteNavFilterKind,
  rawValue: string,
  world?: 'design' | 'technical',
): string {
  const value = rawValue.trim()
  if (!value) return '/negozio'

  switch (kind) {
    case 'category': {
      const slug = canonicalizeCategorySlug(value)
      if (world === 'design') return `/negozio?world=design&category=${encodeURIComponent(slug)}`
      return `/categoria-tecnica/${encodeURIComponent(slug)}`
    }
    case 'tag': {
      const params = new URLSearchParams()
      if (world) params.set('world', world)
      params.set('tag', value)
      return `/negozio?${params.toString()}`
    }
    case 'brand':
      return `/brand/${encodeURIComponent(canonicalizeBrandSlug(value))}`
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

type FlatCategory = { slug: string; name: string; count: number }

function flattenCategories(nodes: CatalogFiltersDTO['categories'], out: FlatCategory[] = []): FlatCategory[] {
  for (const node of nodes) {
    out.push({ slug: node.slug, name: node.name, count: node.count })
    if (node.children?.length) flattenCategories(node.children, out)
  }
  return out
}

export function resolveNavFilterLabel(
  filters: CatalogFiltersDTO,
  kind: SiteNavFilterKind,
  rawValue: string,
): string | null {
  const value = rawValue.trim()
  if (!value) return null

  switch (kind) {
    case 'category': {
      const slug = canonicalizeCategorySlug(value)
      const hit = flattenCategories(filters.categories).find((c) => c.slug === slug)
      return hit?.name ?? null
    }
    case 'brand': {
      const slug = canonicalizeBrandSlug(value)
      return filters.brands.find((b) => b.slug === slug)?.name ?? null
    }
    case 'tag':
      return filters.tags.find((t) => t.value === value)?.label ?? null
    case 'attacco':
      return filters.attacchi.find((t) => t.value.toLowerCase() === value.toLowerCase())?.label ?? null
    case 'tipologia':
      return filters.tipologie.find((t) => t.value.toLowerCase() === value.toLowerCase())?.label ?? null
    case 'stile':
      return filters.stili.find((t) => t.value.toLowerCase() === value.toLowerCase())?.label ?? null
    case 'ambiente':
      return filters.ambienti.find((t) => t.value.toLowerCase() === value.toLowerCase())?.label ?? null
  }
}

export function applyFilterPinToLink(
  link: SiteLink,
  filters: CatalogFiltersDTO | null | undefined,
): SiteLink {
  if (!isFilterPinnedLink(link) || !link.filterKind || !link.filterValue) return link

  const kind = link.filterKind
  const value = link.filterValue.trim()
  const href = buildNavFilterHref(kind, value, link.filterWorld)
  const labelFromOdoo = filters ? resolveNavFilterLabel(filters, kind, value) : null

  return {
    ...link,
    href,
    label: labelFromOdoo?.trim() || link.label || value,
  }
}

export function resolveShellFilterLinks(
  content: SiteShellContent,
  filters: CatalogFiltersDTO | null | undefined,
): SiteShellContent {
  const items = content.nav.items.map((item) => {
    if (item.kind !== 'dropdown') return item
    const defaultWorld: 'design' | 'technical' | undefined =
      item.id === 'tecnico' ? 'technical' : item.id === 'arredo' ? 'design' : undefined

    return {
      ...item,
      panel: {
        ...item.panel,
        columns: item.panel.columns.map((column) => ({
          ...column,
          links: column.links.map((link) => {
            const withWorld =
              link.filterWorld || !isFilterPinnedLink(link)
                ? link
                : { ...link, filterWorld: defaultWorld }
            return applyFilterPinToLink(withWorld, filters)
          }),
        })),
      },
    }
  })

  return { ...content, nav: { ...content.nav, items } }
}
