import type { ProductBrandDTO } from '@/types/dto'

const KNOWN_BRANDS: ReadonlyArray<{ pattern: RegExp; label: string; slug: string }> = [
  { pattern: /\bTLB(?:\s+Italy)?\b/i, label: 'TLB', slug: 'tlb-italy' },
  { pattern: /\bOSRAM\b/i, label: 'OSRAM', slug: 'osram' },
  { pattern: /\bPhilips\b/i, label: 'PHILIPS', slug: 'philips' },
  { pattern: /\bArtemide\b/i, label: 'ARTEMIDE', slug: 'artemide' },
  { pattern: /\bFlos\b/i, label: 'FLOS', slug: 'flos' },
  { pattern: /\bFontanaArte\b/i, label: 'FONTANAARTE', slug: 'fontanaarte' },
  { pattern: /\bMean\s*Well\b/i, label: 'MEAN WELL', slug: 'mean-well' },
  { pattern: /\bVossloh\b/i, label: 'VOSSLOH', slug: 'vossloh' },
]

export function inferTechnicalProductBrandFromName(name: string): ProductBrandDTO | null {
  const haystack = name.trim()
  if (!haystack) return null

  for (const brand of KNOWN_BRANDS) {
    if (brand.pattern.test(haystack)) {
      return { slug: brand.slug, name: brand.label }
    }
  }

  return null
}

export function formatTechnicalProductBrandLabel(name: string): string {
  const trimmed = name.trim()
  if (/^tlb(?:\s+italy)?$/i.test(trimmed)) return 'TLB'
  return trimmed.toUpperCase()
}

export function formatTechnicalProductRefLine(product: {
  brand?: ProductBrandDTO | null
  sku?: string | null
  name?: string
}): string | null {
  const brandName = product.brand?.name?.trim() || inferTechnicalProductBrandFromName(product.name ?? '')?.name
  const code = product.sku?.trim()

  if (brandName && code) {
    return `${formatTechnicalProductBrandLabel(brandName)} · ${code}`
  }
  if (brandName) return formatTechnicalProductBrandLabel(brandName)
  if (code) return code
  return null
}
