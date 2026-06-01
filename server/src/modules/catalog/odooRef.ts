/**
 * Convenzioni ref carrello / Odoo.
 * - productRef: ID numerico `product.template` (stringa) oppure slug legacy Odoo/mock
 * - variantRef: ID numerico `product.product` oppure `VAR-{id}` legacy
 */

export function parseOdooTemplateId(productRef: string): number | null {
  const trimmed = productRef.trim()
  if (/^\d+$/.test(trimmed)) {
    const id = Number(trimmed)
    return Number.isInteger(id) && id > 0 ? id : null
  }
  const tpl = /^tpl-(\d+)$/i.exec(trimmed)
  if (tpl) {
    const id = Number(tpl[1])
    return Number.isInteger(id) && id > 0 ? id : null
  }
  const legacy = /-(\d+)$/.exec(trimmed) ?? /^p-(\d+)$/i.exec(trimmed)
  if (!legacy) return null
  const id = Number(legacy[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export function parseOdooVariantId(variantRef: string | null | undefined): number | null {
  if (!variantRef?.trim()) return null
  const trimmed = variantRef.trim()
  if (/^\d+$/.test(trimmed)) {
    const id = Number(trimmed)
    return Number.isInteger(id) && id > 0 ? id : null
  }
  const legacy = /^VAR-(\d+)$/i.exec(trimmed)
  if (!legacy) return null
  const id = Number(legacy[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export function formatOdooTemplateRef(templateId: number): string {
  return String(templateId)
}

export function formatOdooVariantRef(variantId: number): string {
  return String(variantId)
}

export function isOdooNumericProductRef(productRef: string): boolean {
  return parseOdooTemplateId(productRef) != null
}
