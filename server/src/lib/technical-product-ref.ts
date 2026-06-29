import type { ProductBrandDTO } from '../types/dto.js'

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

function resolveListSku(product: {
  sku?: string | null
  default_code?: string | null
  manufacturer_code?: string | null
  ced?: string | null
}): string | null {
  for (const value of [product.sku, product.manufacturer_code, product.default_code, product.ced]) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return null
}

export function resolveTechnicalProductCardMeta(
  product: {
    title: string
    brand?: { slug?: string; name?: string } | null
    sku?: string | null
    default_code?: string | null
    manufacturer_code?: string | null
    ced?: string | null
  },
): { brand: ProductBrandDTO | null; sku: string | null } {
  const mappedBrand =
    product.brand?.slug && product.brand?.name
      ? { slug: product.brand.slug, name: product.brand.name }
      : null

  return {
    brand: mappedBrand ?? inferTechnicalProductBrandFromName(product.title),
    sku: resolveListSku(product),
  }
}
