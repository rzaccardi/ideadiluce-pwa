/**
 * Loghi marchi catalogo in `/public/brands/{stem}.jpg`.
 * Stem = slug file; alias coprono slug Odoo/CMS diversi dal filename.
 */

const BRAND_LOGO_STEMS = new Set([
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
])

/** slug prodotto/API → stem file in `/brands` */
const BRAND_LOGO_ALIASES: Record<string, string> = {
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
  'generalelectric': 'general-electric',
  'general-electric': 'general-electric',
  '3ffilippi': '3f-filippi',
  '3f-filippi': '3f-filippi',
  carlobezzi: 'carlo-bezzi',
  'carlo-bezzi': 'carlo-bezzi',
}

function normalizeLogoKey(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Path pubblico del logo brand, o `null` se non c’è asset in `/brands`. */
export function resolveBrandLogoSrc(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null
  const key = normalizeLogoKey(slug)
  const stem = BRAND_LOGO_ALIASES[key] ?? key
  if (!BRAND_LOGO_STEMS.has(stem)) return null
  return `/brands/${stem}.jpg`
}
