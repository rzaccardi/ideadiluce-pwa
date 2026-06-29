import type { ArflyVariant } from '../../adapters/arfly/arfly.types.js'
import type { QuickReorderMatchTypeDTO } from '../../types/dto.js'
import { normalizeProductCode } from './catalog-code-parser.js'

export type OdooVariantRow = {
  id: number
  product_tmpl_id: [number, string] | number
  default_code?: string | false
  barcode?: string | false
}

export type OdooVariantCodeMatch = {
  variantId: number
  templateId: number
  defaultCode: string | null
  barcode: string | null
  matchField: 'barcode' | 'default_code'
}

function templateIdFromRow(row: OdooVariantRow): number | null {
  const raw = row.product_tmpl_id
  if (Array.isArray(raw) && typeof raw[0] === 'number') return raw[0]
  if (typeof raw === 'number' && raw > 0) return raw
  return null
}

function textField(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim()
  return null
}

export function matchArflyVariant(
  variants: ArflyVariant[],
  code: string,
): { variant: ArflyVariant; matchType: QuickReorderMatchTypeDTO } | null {
  const normalized = normalizeProductCode(code)
  if (!normalized) return null

  for (const variant of variants) {
    if (normalizeProductCode(variant.ced) === normalized) {
      return { variant, matchType: 'arfly_sku' }
    }
    if (variant.ean && normalizeProductCode(variant.ean) === normalized) {
      return { variant, matchType: 'arfly_ean' }
    }
    if (normalizeProductCode(variant.manufacturer_code) === normalized) {
      return { variant, matchType: 'arfly_mpn' }
    }
    if (String(variant.id) === normalized) {
      return { variant, matchType: 'arfly_variant_id' }
    }
  }

  return null
}

export function pickOdooVariantMatch(rows: OdooVariantRow[], code: string): OdooVariantCodeMatch | null {
  const normalized = code.trim()
  if (!normalized || rows.length === 0) return null

  const exactBarcode = rows.find((row) => textField(row.barcode) === normalized)
  const exactSku = rows.find((row) => textField(row.default_code) === normalized)
  const row = exactBarcode ?? exactSku ?? rows[0]
  if (!row) return null

  const templateId = templateIdFromRow(row)
  if (templateId == null) return null

  const barcode = textField(row.barcode)
  const defaultCode = textField(row.default_code)
  const matchField: OdooVariantCodeMatch['matchField'] =
    exactBarcode || barcode === normalized ? 'barcode' : 'default_code'

  return {
    variantId: row.id,
    templateId,
    defaultCode,
    barcode,
    matchField,
  }
}
