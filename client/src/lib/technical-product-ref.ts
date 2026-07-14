import type { ProductBrandDTO } from '@/types/dto'
import {
  collectProductIdentifierFields,
  formatProductIdentifierInline,
  type ProductIdentifierFieldKey,
} from '@/lib/product-identifier-fields'

const REF_LINE_LABELS: Record<ProductIdentifierFieldKey, string> = {
  brand: 'Marca',
  manufacturerCode: 'MPN',
  ced: 'CED',
  sku: 'COD',
  defaultCode: 'Codice',
  ean: 'EAN',
  weightKg: 'Peso',
  lengthMeters: 'Lunghezza',
  dimensions: 'Dimensioni',
}

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
  ced?: string | null
  manufacturerCode?: string | null
  defaultCode?: string | null
  ean?: string | null
  name?: string
}): string | null {
  const brand =
    product.brand ?? (product.name ? inferTechnicalProductBrandFromName(product.name) : null)

  return formatProductIdentifierInline(
    collectProductIdentifierFields(
      {
        ...product,
        brand,
      },
      null,
      { includeBrand: true },
    ),
    REF_LINE_LABELS,
    { compactBrand: true, formatBrand: formatTechnicalProductBrandLabel },
  )
}
