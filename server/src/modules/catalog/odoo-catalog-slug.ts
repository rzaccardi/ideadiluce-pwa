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
