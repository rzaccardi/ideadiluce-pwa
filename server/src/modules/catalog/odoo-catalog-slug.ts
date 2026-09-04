export type CatalogBrandWorld = 'design' | 'technical'

const DESIGN_CATEGORY_RE = /arredo|design|decorativ/i
const TECHNICAL_CATEGORY_RE =
  /tecnico|tecnica|tecnici|ricambi|lampadine|componenti|driver|alimentator/i

/** Mondi catalogo (arredo/tecnico) dai slug categoria Odoo del prodotto. */
export function inferCatalogWorldsFromCategorySlugs(
  slugs: ReadonlyArray<string | null | undefined>,
): CatalogBrandWorld[] {
  const haystack = slugs.filter(Boolean).join(' ')
  if (!haystack) return []
  const worlds: CatalogBrandWorld[] = []
  if (DESIGN_CATEGORY_RE.test(haystack)) worlds.push('design')
  if (TECHNICAL_CATEGORY_RE.test(haystack)) worlds.push('technical')
  return worlds
}

export function mergeCatalogBrandWorlds(
  ...lists: Array<ReadonlyArray<CatalogBrandWorld> | undefined>
): CatalogBrandWorld[] {
  const seen = new Set<CatalogBrandWorld>()
  for (const list of lists) {
    for (const world of list ?? []) seen.add(world)
  }
  return (['design', 'technical'] as const).filter((world) => seen.has(world))
}

export function slugifyCatalogToken(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function slugifyBrandName(name: string): string {
  return slugifyCatalogToken(name) || 'brand'
}

/**
 * Alias slug brand Odoo ecommerce ↔ slug “corto” usato in search/listing.
 * Es. indice/cache può esporre `tlb-italy` mentre `/api/v2` filtra su `tlb`.
 */
const BRAND_SLUG_ALIASES: Record<string, string> = {
  'tlb-italy': 'tlb',
  tlbitaly: 'tlb',
}

export function canonicalizeBrandSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return normalized
  return BRAND_SLUG_ALIASES[normalized] ?? normalized
}

/** Slug canonico + alias noti (per lookup bidirezionale). */
export function brandSlugLookupKeys(slug: string): string[] {
  const canonical = canonicalizeBrandSlug(slug)
  const keys = new Set<string>([canonical, slug.trim().toLowerCase()])
  for (const [alias, target] of Object.entries(BRAND_SLUG_ALIASES)) {
    if (target === canonical) keys.add(alias)
  }
  return [...keys].filter(Boolean)
}
