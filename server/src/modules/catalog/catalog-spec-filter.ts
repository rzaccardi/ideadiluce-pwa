import type { ProductCardDTO } from '../../types/dto.js'
import { buildTechnicalCardSpecTags } from '../../lib/technical-card-spec-tags.js'

export type CatalogSpecFilters = {
  attacco?: string
  colorTemp?: string
}

const ATTACCO_PARAM_RE = /^[A-Za-z0-9.\-]{2,16}$/
const COLOR_TEMP_PARAM_RE = /^\d{3,4}K?$/i

export function sanitizeAttaccoParam(value: unknown): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || !ATTACCO_PARAM_RE.test(trimmed)) return undefined
  return trimmed.replace(/GU5[.-]3/i, 'GU5.3').replace(/^r7s$/i, 'R7s')
}

export function sanitizeColorTempParam(value: unknown): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || !COLOR_TEMP_PARAM_RE.test(trimmed)) return undefined
  const digits = trimmed.replace(/\s/g, '').replace(/K$/i, '')
  return `${digits}K`
}

export function hasActiveSpecFilters(filters: CatalogSpecFilters): boolean {
  return Boolean(filters.attacco?.trim() || filters.colorTemp?.trim())
}

function normalizeSocketFilter(value: string): string {
  return value.replace(/GU5[.-]3/i, 'GU5.3').replace(/^r7s$/i, 'R7s').toUpperCase()
}

function normalizeKelvinFilter(value: string): string {
  return value.replace(/\s/g, '').toUpperCase()
}

export function productMatchesSpecFilter(
  product: Pick<ProductCardDTO, 'name' | 'shortDescription' | 'specTags'>,
  filters: CatalogSpecFilters,
): boolean {
  if (!hasActiveSpecFilters(filters)) return true

  const tags = buildTechnicalCardSpecTags({
    name: product.name,
    shortDescription: product.shortDescription,
    specTags: product.specTags,
  })
  const haystack = [...tags, product.name, product.shortDescription ?? '']
    .join(' ')
    .replace(/GU5[.-]3/gi, 'GU5.3')

  if (filters.attacco?.trim()) {
    const needle = normalizeSocketFilter(filters.attacco)
    if (!haystack.toUpperCase().includes(needle)) return false
  }

  if (filters.colorTemp?.trim()) {
    const needle = normalizeKelvinFilter(filters.colorTemp)
    if (!haystack.toUpperCase().includes(needle)) return false
  }

  return true
}

export function productMatchesCatalogTextQuery(
  product: Pick<ProductCardDTO, 'name' | 'shortDescription' | 'sku' | 'specTags'>,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [product.name, product.shortDescription, product.sku, ...(product.specTags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return q.split(/\s+/).every((token) => haystack.includes(token))
}
