import {
  findMergableCartLine,
  normalizeCartProductRef,
  normalizeCartVariantRef,
} from '../cart/cart-line-identity.js'

export function cartLineKey(productRef: string, variantRef: string | null) {
  return `${normalizeCartProductRef(productRef)}\0${normalizeCartVariantRef(variantRef) ?? ''}`
}

export type MergedCartLine = {
  productRef: string
  variantRef: string | null
  quantity: number
  clientUnitPriceEstimate: number | null
  metadataJson: unknown
}

export function absorbCartLines(
  merged: Map<string, MergedCartLine>,
  lines: Array<{
    productRef: string
    variantRef: string | null
    quantity: number
    clientUnitPriceEstimate: number | null
    metadataJson: unknown
  }>,
) {
  const current = [...merged.values()]
  for (const line of lines) {
    const existing = findMergableCartLine(current, {
      productRef: line.productRef,
      variantRef: line.variantRef,
      metadataJson: line.metadataJson,
    })
    if (existing) {
      // Rimuovi la vecchia chiave (potrebbe essere slug/VAR- diversa dalla canonica).
      for (const [key, value] of merged) {
        if (value === existing) {
          merged.delete(key)
          break
        }
      }
      existing.quantity += line.quantity
      if (line.clientUnitPriceEstimate != null) {
        existing.clientUnitPriceEstimate = line.clientUnitPriceEstimate
      }
      if (line.metadataJson != null) {
        existing.metadataJson = line.metadataJson
      }
      const productRef = normalizeCartProductRef(
        parseTemplatePreferred(existing.productRef, line.productRef),
      )
      const variantRef =
        normalizeCartVariantRef(existing.variantRef) ??
        normalizeCartVariantRef(line.variantRef) ??
        existing.variantRef
      existing.productRef = productRef
      existing.variantRef = variantRef
      merged.set(cartLineKey(productRef, variantRef), existing)
      continue
    }

    const productRef = normalizeCartProductRef(line.productRef)
    const variantRef = normalizeCartVariantRef(line.variantRef)
    const created: MergedCartLine = {
      productRef,
      variantRef,
      quantity: line.quantity,
      clientUnitPriceEstimate: line.clientUnitPriceEstimate,
      metadataJson: line.metadataJson,
    }
    merged.set(cartLineKey(productRef, variantRef), created)
    current.push(created)
  }
}

function parseTemplatePreferred(a: string, b: string): string {
  // Preferisci ref numerico template se presente.
  if (/^\d+$/.test(a.trim())) return a
  if (/^\d+$/.test(b.trim())) return b
  return a
}

export function mergeCartItemLists(
  carts: Array<{
    items: Array<{
      productRef: string
      variantRef: string | null
      quantity: number
      clientUnitPriceEstimate: number | null
      metadataJson: unknown
    }>
  }>,
): MergedCartLine[] {
  const merged = new Map<string, MergedCartLine>()
  for (const cart of carts) {
    absorbCartLines(merged, cart.items)
  }
  return [...merged.values()]
}
