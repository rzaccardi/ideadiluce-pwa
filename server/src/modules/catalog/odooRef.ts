/**
 * Convenzioni ref carrello / Odoo.
 * - productRef: ID numerico `product.template` (stringa) oppure slug legacy Odoo/mock
 * - variantRef: ID numerico `product.product` oppure `VAR-{id}` legacy
 */

function positiveInt(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * Solo ref espliciti (`123`, `tpl-123`, `p-123`).
 * Non usare su slug URL: suffissi tipo `-840` non sono template id.
 */
export function parseExplicitOdooTemplateId(productRef: string): number | null {
  const trimmed = productRef.trim()
  if (/^\d+$/.test(trimmed)) return positiveInt(trimmed)
  const tpl = /^tpl-(\d+)$/i.exec(trimmed)
  if (tpl) return positiveInt(tpl[1])
  const prefixed = /^p-(\d+)$/i.exec(trimmed)
  if (prefixed) return positiveInt(prefixed[1])
  return null
}

export function parseOdooTemplateId(productRef: string): number | null {
  const explicit = parseExplicitOdooTemplateId(productRef)
  if (explicit != null) return explicit
  const trimmed = productRef.trim()
  // Legacy cart/mock: `nome-prodotto-{templateId}` — non usare per resolve slug storefront.
  const legacy = /-(\d+)$/.exec(trimmed)
  if (!legacy) return null
  return positiveInt(legacy[1])
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
