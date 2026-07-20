import type { ProductBrandDTO } from '../types/dto.js'

const KNOWN_BRANDS: ReadonlyArray<{ pattern: RegExp; label: string; slug: string }> = [
  { pattern: /\bTLB(?:\s+Italy)?\b/i, label: 'TLB', slug: 'tlb' },
  { pattern: /\bOSRAM\b/i, label: 'OSRAM', slug: 'osram' },
  { pattern: /\bPhilips\b/i, label: 'PHILIPS', slug: 'philips' },
  { pattern: /\bGeneral\s*Electric\b|\bGE\b/i, label: 'GENERAL ELECTRIC', slug: 'general-electric' },
  { pattern: /\bSylvania\b/i, label: 'SYLVANIA', slug: 'sylvania' },
  { pattern: /\bSPL\b/i, label: 'SPL', slug: 'spl' },
  { pattern: /\bVossloh\b/i, label: 'VOSSLOH', slug: 'vossloh' },
  { pattern: /\bLedvance\b/i, label: 'LEDVANCE', slug: 'ledvance' },
  { pattern: /\bAigostar\b/i, label: 'AIGOSTAR', slug: 'aigostar' },
  { pattern: /\bPatron\b/i, label: 'PATRON', slug: 'patron' },
  { pattern: /\bIlesa\b/i, label: 'ILESA', slug: 'ilesa' },
  { pattern: /\bDuralamp\b/i, label: 'DURALAMP', slug: 'duralamp' },
  { pattern: /\bCentury\b/i, label: 'CENTURY', slug: 'century' },
  { pattern: /\bThorgeon\b/i, label: 'THORGEON', slug: 'thorgeon' },
  { pattern: /\bTCI\b/i, label: 'TCI', slug: 'tci' },
  { pattern: /\bGenelux\b/i, label: 'GENELUX', slug: 'genelux' },
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
  manufacturer_code?: string | null
  ced?: string | null
  /** @deprecated Non più nel contratto v2. */
  default_code?: string | null
}): string | null {
  for (const value of [product.sku, product.manufacturer_code, product.ced, product.default_code]) {
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
    manufacturer_code?: string | null
    ced?: string | null
    /** @deprecated Non più nel contratto v2. */
    default_code?: string | null
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
