/**
 * Loghi già presenti in `client/public/brands/{stem}.jpg`.
 * Usati come logo light di default sui brand Odoo corrispondenti.
 */

export const STATIC_BRAND_LOGO_STEMS = [
  '3f-filippi',
  'artemide',
  'bega',
  'carlo-bezzi',
  'century',
  'dura-lamp',
  'eglo',
  'erc',
  'flos',
  'fontana-arte',
  'foscarini',
  'general-electric',
  'hitachi',
  'ideal-lux',
  'iguzzini',
  'kartell',
  'ledvance',
  'mazda',
  'mean-well',
  'osram',
  'pallucco',
  'philips',
  'sylvania',
  'tci',
  'tlb-1',
  'tlb-italy',
  'tridonic',
  'venini',
  'vossloh',
] as const

const STEM_SET = new Set<string>(STATIC_BRAND_LOGO_STEMS)

/** slug Odoo / alias → stem file */
const ALIASES: Record<string, string> = {
  tlb: 'tlb-italy',
  tlbitaly: 'tlb-italy',
  'tlb-italy': 'tlb-italy',
  'tlb-1': 'tlb-1',
  duralamp: 'dura-lamp',
  'dura-lamp': 'dura-lamp',
  fontanaarte: 'fontana-arte',
  'fontana-arte': 'fontana-arte',
  ideallux: 'ideal-lux',
  'ideal-lux': 'ideal-lux',
  meanwell: 'mean-well',
  'mean-well': 'mean-well',
  generalelectric: 'general-electric',
  'general-electric': 'general-electric',
  '3ffilippi': '3f-filippi',
  '3f-filippi': '3f-filippi',
  carlobezzi: 'carlo-bezzi',
  'carlo-bezzi': 'carlo-bezzi',
  'i-guzzini': 'iguzzini',
  iguzzini: 'iguzzini',
}

export function normalizeBrandSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function resolveStaticBrandStem(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null
  const key = normalizeBrandSlug(slug)
  const stem = ALIASES[key] ?? key
  return STEM_SET.has(stem) ? stem : null
}

/** Path pubblico relativo sul client PWA. */
export function staticBrandLogoPath(stem: string): string {
  return `/brands/${stem}.jpg`
}

export function resolveStaticBrandLogoSrc(slug: string | null | undefined): string | null {
  const stem = resolveStaticBrandStem(slug)
  return stem ? staticBrandLogoPath(stem) : null
}

/** True se l’URL è un asset statico `/brands/*.jpg` (crop JPG, non PNG CDN). */
export function isStaticBrandLogoUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /\/brands\/[a-z0-9-]+\.jpe?g(?:\?|$)/i.test(url)
}
