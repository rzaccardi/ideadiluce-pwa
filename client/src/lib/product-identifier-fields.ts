import type { ProductCardDTO, ProductDetailDTO, ProductVariantDTO } from '@/types/dto'

export type ProductIdentifierFieldKey =
  | 'brand'
  | 'manufacturerCode'
  | 'ced'
  | 'sku'
  | 'defaultCode'
  | 'ean'
  | 'weightKg'
  | 'lengthMeters'
  | 'dimensions'

export type ProductIdentifierField = {
  key: ProductIdentifierFieldKey
  value: string
}

export type ProductIdentifierSource = Pick<
  ProductCardDTO,
  'brand' | 'sku' | 'ean' | 'ced' | 'manufacturerCode' | 'defaultCode'
> &
  Partial<Pick<ProductDetailDTO, 'weightKg' | 'lengthMeters' | 'dimensions'>>

export type ProductIdentifierVariantSource = Pick<
  ProductVariantDTO,
  'ean' | 'ced' | 'manufacturerCode'
>

type FieldRule = {
  key: ProductIdentifierFieldKey
  read: (product: ProductIdentifierSource, variant?: ProductIdentifierVariantSource | null) => string | null
}

function trimValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed || null
}

function formatDimensions(
  dimensions: NonNullable<ProductDetailDTO['dimensions']>,
): string | null {
  const parts: string[] = []
  if (dimensions.lengthCm != null) parts.push(`${dimensions.lengthCm} cm`)
  if (dimensions.widthCm != null) parts.push(`${dimensions.widthCm} cm`)
  if (dimensions.heightCm != null) parts.push(`${dimensions.heightCm} cm`)
  return parts.length ? parts.join(' × ') : null
}

const FIELD_RULES: FieldRule[] = [
  {
    key: 'brand',
    read: (product) => trimValue(product.brand?.name),
  },
  {
    key: 'manufacturerCode',
    read: (product, variant) =>
      trimValue(variant?.manufacturerCode) ?? trimValue(product.manufacturerCode),
  },
  {
    key: 'ced',
    read: (product, variant) => trimValue(variant?.ced) ?? trimValue(product.ced),
  },
  {
    key: 'sku',
    read: (product) => trimValue(product.sku),
  },
  {
    key: 'defaultCode',
    read: (product) => trimValue(product.defaultCode),
  },
  {
    key: 'ean',
    read: (product, variant) => trimValue(variant?.ean) ?? trimValue(product.ean),
  },
  {
    key: 'weightKg',
    read: (product) =>
      product.weightKg != null && Number.isFinite(product.weightKg)
        ? `${product.weightKg} kg`
        : null,
  },
  {
    key: 'lengthMeters',
    read: (product) =>
      product.lengthMeters != null && Number.isFinite(product.lengthMeters)
        ? `${product.lengthMeters} m`
        : null,
  },
  {
    key: 'dimensions',
    read: (product) => (product.dimensions ? formatDimensions(product.dimensions) : null),
  },
]

function normalizeForDedupe(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

export function collectProductIdentifierFields(
  product: ProductIdentifierSource,
  variant?: ProductIdentifierVariantSource | null,
  options?: { includeBrand?: boolean },
): ProductIdentifierField[] {
  const includeBrand = options?.includeBrand ?? true
  const seenValues = new Set<string>()
  const fields: ProductIdentifierField[] = []

  for (const rule of FIELD_RULES) {
    if (!includeBrand && rule.key === 'brand') continue
    const value = rule.read(product, variant)
    if (!value) continue

    const dedupeKey = normalizeForDedupe(value)
    if (seenValues.has(dedupeKey)) continue
    seenValues.add(dedupeKey)

    fields.push({ key: rule.key, value })
  }

  return fields
}

export function formatProductIdentifierInline(
  fields: ReadonlyArray<ProductIdentifierField>,
  labels: Record<ProductIdentifierFieldKey, string>,
  options?: { compactBrand?: boolean; formatBrand?: (value: string) => string },
): string | null {
  if (!fields.length) return null
  return fields
    .map((field) => {
      if (field.key === 'brand' && options?.compactBrand) {
        return options.formatBrand?.(field.value) ?? field.value
      }
      return `${labels[field.key]} ${field.value}`
    })
    .join(' · ')
}
