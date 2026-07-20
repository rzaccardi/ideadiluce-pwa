/**
 * Costruisce opzioni UI filtri da `CatalogFiltersDTO` (Odoo `/api/v2/filters`).
 */
import type { CatalogFiltersDTO, CatalogFiltersFacetOptionDTO } from '@/types/dto'
import type {
  CategoryFilterGroup,
  CategoryStat,
  CategorySubtypeChip,
  CategoryTypeTile,
} from '@/types/category-landing'
import {
  CATALOG_COLOR_TEMPS,
  CATALOG_PRICE_BUCKETS,
  CATALOG_SOCKET_FILTERS,
} from '@/lib/catalog-filters'

export type FacetChipOption = {
  value: string
  label: string
  count?: number
}

export type FacetBrandOption = {
  slug: string
  name: string
  count?: number
}

export type FacetCategoryOption = {
  slug: string
  name: string
  count?: number
  parentSlug?: string | null
}

/** Limite solo per wattaggio chip (legacy); il range UI usa tutti i valori. */
const MAX_WATTAGGIO_OPTIONS = 12

function slugToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-]/g, '')
}

function sortByCountDesc<T extends { count?: number }>(items: ReadonlyArray<T>): T[] {
  return [...items].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
}

function normalizeWattValue(value: string | number): string {
  const raw = String(value).trim()
  if (/^\d+\.0+$/.test(raw)) return raw.replace(/\.0+$/, '')
  return raw
}

export function colorTempFacetToParam(value: string | number): string {
  const digits = String(value).replace(/\s/g, '').replace(/K$/i, '')
  return `${digits}K`
}

export function attaccoFacetToParam(value: string, label?: string): string {
  const raw = (label || value).trim()
  if (!raw) return String(value).trim()
  // Preferisci label UI (G4, GU5.3) — Odoo accetta case-insensitive.
  return raw
}

function hasFacetsPayload(
  facets: CatalogFiltersDTO | null | undefined | { attacchi?: ReadonlyArray<CatalogFiltersFacetOptionDTO> },
): facets is CatalogFiltersDTO | { attacchi?: ReadonlyArray<CatalogFiltersFacetOptionDTO> } {
  return facets != null
}

/** Opzioni attacco per sidebar negozio. */
export function facetAttaccoOptions(
  facets: CatalogFiltersDTO | null | undefined | { attacchi?: ReadonlyArray<CatalogFiltersFacetOptionDTO> },
): FacetChipOption[] {
  if (hasFacetsPayload(facets)) {
    if (!facets.attacchi?.length) return []
    return sortByCountDesc(facets.attacchi).map((o) => ({
      value: String(o.value),
      label: o.label || String(o.value).toUpperCase(),
      count: o.count,
    }))
  }
  return CATALOG_SOCKET_FILTERS.map((s) => ({ value: s, label: s }))
}

/** Opzioni Kelvin per sidebar negozio (`3000K`). */
export function facetColorTempOptions(
  facets: CatalogFiltersDTO | null | undefined,
): FacetChipOption[] {
  if (facets != null) {
    if (!facets.colorTemps?.length) return []
    return sortByCountDesc(
      facets.colorTemps.filter((o) => {
        const n = Number(String(o.value).replace(/\s/g, '').replace(/K$/i, ''))
        return Number.isFinite(n) && n > 0
      }),
    ).map((o) => {
      const value = colorTempFacetToParam(o.value)
      return { value, label: o.label || value, count: o.count }
    })
  }
  return CATALOG_COLOR_TEMPS.map((t) => ({ value: t, label: t }))
}

export function facetWattaggioOptions(
  facets: CatalogFiltersDTO | null | undefined,
): FacetChipOption[] {
  if (facets == null || !facets.wattaggi?.length) return []
  return sortByCountDesc(facets.wattaggi)
    .slice(0, MAX_WATTAGGIO_OPTIONS)
    .map((o) => {
      const value = normalizeWattValue(o.value)
      return {
        value,
        label: o.label || `${value} W`,
        count: o.count,
      }
    })
}

/** Valori watt numerici ordinati (per slider range). Dedup su numero. */
export function facetWattaggioNumericValues(
  facets: CatalogFiltersDTO | null | undefined,
): number[] {
  if (facets == null || !facets.wattaggi?.length) return []
  const seen = new Set<number>()
  const out: number[] = []
  for (const item of facets.wattaggi) {
    const n = Number(normalizeWattValue(item.value))
    if (!Number.isFinite(n) || n < 0 || seen.has(n)) continue
    seen.add(n)
    out.push(n)
  }
  return out.sort((a, b) => a - b)
}

export function formatWattLabel(watts: number): string {
  if (!Number.isFinite(watts)) return '—'
  const rounded = Math.round(watts * 10) / 10
  return Number.isInteger(rounded) ? `${rounded} W` : `${rounded} W`
}

export function facetBrandOptions(
  facets: CatalogFiltersDTO | null | undefined,
): FacetBrandOption[] {
  if (facets == null || !facets.brands?.length) return []
  return sortByCountDesc(facets.brands).map((b) => ({
    slug: b.slug,
    name: b.name,
    count: b.count,
  }))
}

/** Opzioni tassonomia design (tipologia / ambiente / stile) da facet `{value,label,count}`. */
export function facetTaxonomyOptions(
  facets: CatalogFiltersDTO | null | undefined,
  kind: 'tipologie' | 'ambienti' | 'stili',
): FacetChipOption[] {
  if (facets == null) return []
  const items = facets[kind]
  if (!items?.length) return []
  return sortByCountDesc(items)
    .filter((o) => (o.count ?? 0) > 0)
    .map((o) => {
      const raw = String(o.value).trim()
      return {
        // Param search/filters: slug Odoo (value), non la label.
        value: slugToken(raw) || raw.toLowerCase(),
        label: o.label?.trim() || humanizeFacetValue(raw),
        count: o.count,
      }
    })
}

function humanizeFacetValue(raw: string): string {
  const s = raw.replace(/[-_]+/g, ' ').trim()
  if (!s) return raw
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function mapCategoryNode(
  cat: CatalogFiltersDTO['categories'][number],
  parentSlug?: string | null,
): FacetCategoryOption {
  return {
    slug: cat.slug,
    name: cat.name,
    count: cat.count,
    parentSlug: cat.parentSlug ?? parentSlug ?? null,
  }
}

/**
 * Radici + figli per sidebar categorie.
 * Se c'è una sola radice mondo (tecnico/arredo) con figli, promuove i figli
 * come categorie navigabili (allineato agli slug Odoo live).
 */
export function facetCategoryOptions(
  facets: CatalogFiltersDTO | null | undefined,
): { roots: FacetCategoryOption[]; children: FacetCategoryOption[] } {
  const top = facets?.categories ?? []
  if (!top.length) return { roots: [], children: [] }

  if (top.length === 1 && (top[0]!.children?.length ?? 0) > 0) {
    const parent = top[0]!
    const roots = parent.children.map((c) => mapCategoryNode(c, parent.slug))
    const children = parent.children.flatMap((c) =>
      (c.children ?? []).map((g) => mapCategoryNode(g, c.slug)),
    )
    return { roots, children }
  }

  const roots = top.map((c) => mapCategoryNode(c, null))
  const children = top.flatMap((c) =>
    (c.children ?? []).map((child) => mapCategoryNode(child, c.slug)),
  )
  return { roots, children }
}

/** Tipologie design (tile) da facet — fallback ai figli di `arredo`. */
export function buildDesignTypeTilesFromFacets(
  facets: CatalogFiltersDTO | null | undefined,
  fallback: ReadonlyArray<CategoryTypeTile> = [],
): CategoryTypeTile[] {
  if (!facets) return [...fallback]

  const fromTipologie = sortByCountDesc(facets.tipologie).filter((t) => t.count > 0)
  if (fromTipologie.length) {
    return fromTipologie.map((t) => {
      const slug = slugToken(String(t.value))
      return {
        key: slug,
        label: t.label,
        count: String(t.count),
        href: `/tipologia/${encodeURIComponent(slug)}`,
      }
    })
  }

  const arredo = facets.categories.find((c) => c.slug === 'arredo')
  const children = arredo?.children?.length
    ? arredo.children
    : facets.categories.flatMap((c) => c.children ?? [])
  if (!children.length) return [...fallback]

  return sortByCountDesc(children)
    .filter((c) => c.count > 0)
    .map((c) => ({
      key: c.slug,
      label: c.name,
      count: String(c.count),
      href: `/negozio?category=arredo&tipologia=${encodeURIComponent(c.slug)}`,
    }))
}

/** Chip sottocategoria tecnica da figli di `tecnico`. */
export function buildTechnicalSubtypeChipsFromFacets(
  facets: CatalogFiltersDTO | null | undefined,
  options: {
    fallback?: ReadonlyArray<CategorySubtypeChip>
    baseHref?: string
    selectedCategorySlug?: string
    catalogMode?: boolean
  } = {},
): CategorySubtypeChip[] {
  const {
    fallback = [],
    baseHref = '/categoria-prodotto/illuminazione-tecnica',
    selectedCategorySlug,
    catalogMode = false,
  } = options

  if (!facets) return [...fallback]

  const tecnico = facets.categories.find((c) => c.slug === 'tecnico')
  const children = tecnico?.children?.length
    ? tecnico.children
    : facets.categories.length === 1
      ? (facets.categories[0]!.children ?? [])
      : []

  if (!children.length) return [...fallback]

  const tuttiHref = catalogMode ? '/negozio?category=tecnico' : baseHref
  const selected = selectedCategorySlug?.trim().toLowerCase()
  const chips: CategorySubtypeChip[] = [
    {
      label: 'Tutti',
      href: tuttiHref,
      active: !selected || selected === 'tecnico' || selected === 'illuminazione-tecnica',
    },
  ]

  for (const child of sortByCountDesc(children).filter((c) => c.count > 0)) {
    const href = catalogMode
      ? `/negozio?category=${encodeURIComponent(child.slug)}`
      : `${baseHref}?f=${encodeURIComponent(`category-${child.slug}`)}`
    chips.push({
      label: child.name,
      href,
      active: selected === child.slug,
    })
  }

  return chips
}

export function buildLandingStatsFromFacets(
  facets: CatalogFiltersDTO | null | undefined,
  fallback: ReadonlyArray<CategoryStat> = [],
): CategoryStat[] {
  if (!facets) return [...fallback]
  const { roots } = facetCategoryOptions(facets)
  const stats: CategoryStat[] = [
    { label: 'prodotti', value: String(facets.totalMatching) },
  ]
  if (facets.brands.length) {
    stats.push({ label: 'brand', value: String(facets.brands.length) })
  }
  if (roots.length) {
    stats.push({ label: 'categorie', value: String(roots.length) })
  }
  return stats
}

function facetToLandingChip(
  prefix: string,
  items: ReadonlyArray<CatalogFiltersFacetOptionDTO>,
  mapValue: (item: CatalogFiltersFacetOptionDTO) => string,
): CategoryFilterGroup | null {
  if (!items.length) return null
  return {
    kind: 'chips',
    label:
      prefix === 'attacco'
        ? 'Attacco'
        : prefix === 'kelvin'
          ? 'Kelvin'
          : prefix === 'wattaggio'
            ? 'Wattaggio'
            : prefix,
    options: items.map((item) => ({
      label: item.label,
      value: `${prefix}-${mapValue(item)}`,
      queryToken: item.label,
      count: item.count,
    })),
  }
}

function brandsToLandingGroup(
  brands: CatalogFiltersDTO['brands'],
): CategoryFilterGroup | null {
  if (!brands.length) return null
  return {
    kind: 'checkbox',
    label: 'Brand',
    options: sortByCountDesc(brands).map((b) => ({
      label: b.name,
      value: `brand-${b.slug}`,
      count: b.count,
    })),
  }
}

function listFacetToCheckboxGroup(
  label: string,
  prefix: string,
  items: ReadonlyArray<CatalogFiltersFacetOptionDTO>,
): CategoryFilterGroup | null {
  if (!items.length) return null
  return {
    kind: 'checkbox',
    label,
    options: sortByCountDesc(items).map((item) => ({
      label: item.label,
      value: `${prefix}-${slugToken(String(item.value))}`,
      queryToken: String(item.value),
      count: item.count,
    })),
  }
}

const PRICE_STOCK_GROUPS: CategoryFilterGroup[] = [
  {
    kind: 'checkbox',
    label: 'Prezzo',
    options: CATALOG_PRICE_BUCKETS.map((b) => ({
      label: b.label,
      value: `price-${b.id}`,
    })),
  },
  {
    kind: 'checkbox',
    label: 'Disponibilità',
    options: [{ label: 'Pronta consegna', value: 'stock-in' }],
  },
]

/**
 * Gruppi filtri landing (design/tecnico) da facet Odoo.
 * Fallback: gruppi statici CMS se facet assenti.
 */
export function buildLandingFilterGroupsFromFacets(
  pageKey: 'design' | 'technical' | 'technical-products',
  facets: CatalogFiltersDTO | null | undefined | Readonly<CatalogFiltersDTO>,
  fallback: ReadonlyArray<CategoryFilterGroup>,
): CategoryFilterGroup[] {
  if (!facets) return [...fallback]

  const groups: CategoryFilterGroup[] = []

  if (pageKey === 'design') {
    const tip = listFacetToCheckboxGroup('Tipologia', 'tipologia', facets.tipologie)
    const amb = listFacetToCheckboxGroup('Ambiente', 'ambiente', facets.ambienti)
    const stil = listFacetToCheckboxGroup('Stile', 'stile', facets.stili)
    if (tip) groups.push(tip)
    if (amb) groups.push(amb)
    if (stil) groups.push(stil)
    const brands = brandsToLandingGroup(facets.brands)
    if (brands) groups.push(brands)
  } else {
    const attacco = facetToLandingChip('attacco', sortByCountDesc(facets.attacchi), (i) =>
      slugToken(i.label || String(i.value)),
    )
    const kelvin = facetToLandingChip(
      'kelvin',
      sortByCountDesc(
        facets.colorTemps.filter((o) => {
          const n = Number(String(o.value).replace(/\s/g, '').replace(/K$/i, ''))
          return Number.isFinite(n) && n > 0
        }),
      ),
      (i) => String(i.value).replace(/\s/g, '').replace(/K$/i, '').toLowerCase() + 'k',
    )
    if (attacco) {
      attacco.label = 'Attacco'
      groups.push(attacco)
    }
    if (kelvin) {
      kelvin.label = 'Kelvin'
      groups.push(kelvin)
    }
    // Wattaggio: UI range dedicata (non chip) — vedi CategoryFilterSidebar.
    const brands = brandsToLandingGroup(facets.brands)
    if (brands) groups.push(brands)
    const { roots: cats } = facetCategoryOptions(facets)
    if (cats.length) {
      groups.push({
        kind: 'checkbox',
        label: 'Categoria',
        options: cats.map((c) => ({
          label: c.name,
          value: `category-${c.slug}`,
          queryToken: c.slug,
          count: c.count,
        })),
      })
    }
    if (facets.tags.length) {
      groups.push({
        kind: 'chips',
        label: 'Tag',
        options: sortByCountDesc(facets.tags).map((t) => ({
          label: t.label,
          value: `tag-${slugToken(String(t.value))}`,
          queryToken: String(t.value),
          count: t.count,
        })),
      })
    }
  }

  // Prezzo + stock restano client-side (non in facet Odoo).
  groups.push(...PRICE_STOCK_GROUPS)

  return groups.length > PRICE_STOCK_GROUPS.length ? groups : [...fallback]
}

/** Estrae codice attacco da value landing `attacco-g4` / `attacco-gu5.3`. */
export function landingAttaccoValueToCode(value: string): string | undefined {
  if (!value.startsWith('attacco-')) return undefined
  const token = value.slice('attacco-'.length).replace(/_/g, '.')
  if (!token) return undefined
  if (/^gu5[\-.]?3$/i.test(token)) return 'GU5.3'
  if (/^gy6[\-.]?35$/i.test(token)) return 'GY6.35'
  if (/^r7s$/i.test(token)) return 'R7s'
  if (/^rx7s$/i.test(token)) return 'RX7S'
  return token.toUpperCase()
}

export function landingKelvinValueToCode(value: string): string | undefined {
  if (!value.startsWith('kelvin-')) return undefined
  const digits = value.slice('kelvin-'.length).replace(/k$/i, '')
  if (!/^\d{3,4}$/.test(digits)) return undefined
  return `${digits}K`
}

export function landingWattaggioValueToCode(value: string): string | undefined {
  if (!value.startsWith('wattaggio-')) return undefined
  const token = normalizeWattValue(value.slice('wattaggio-'.length))
  return token || undefined
}

/** Label categoria da tree facet (radici + figli + nipoti). */
export function facetCategoryLabel(
  facets: CatalogFiltersDTO | null | undefined,
  slug?: string,
): string | undefined {
  if (!facets || !slug) return undefined
  const needle = slug.trim().toLowerCase()
  const walk = (nodes: CatalogFiltersDTO['categories']): string | undefined => {
    for (const node of nodes) {
      if (node.slug.toLowerCase() === needle) return node.name
      const nested = walk(node.children ?? [])
      if (nested) return nested
    }
    return undefined
  }
  return walk(facets.categories)
}
