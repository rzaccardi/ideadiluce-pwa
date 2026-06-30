export function cartLineKey(productRef: string, variantRef: string | null) {
  return `${productRef}\0${variantRef ?? ''}`
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
  for (const line of lines) {
    const key = cartLineKey(line.productRef, line.variantRef)
    const existing = merged.get(key)
    if (existing) {
      existing.quantity += line.quantity
      if (line.clientUnitPriceEstimate != null) {
        existing.clientUnitPriceEstimate = line.clientUnitPriceEstimate
      }
      if (line.metadataJson != null) {
        existing.metadataJson = line.metadataJson
      }
      continue
    }
    merged.set(key, {
      productRef: line.productRef,
      variantRef: line.variantRef,
      quantity: line.quantity,
      clientUnitPriceEstimate: line.clientUnitPriceEstimate,
      metadataJson: line.metadataJson,
    })
  }
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
