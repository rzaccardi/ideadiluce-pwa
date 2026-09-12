export type OdooPricelistItemRow = {
  applied_on?: string
  compute_price?: string
  fixed_price?: number
  percent_price?: number
  price_discount?: number
  price_surcharge?: number
  min_quantity?: number
  product_id?: [number, string] | false
  product_tmpl_id?: [number, string] | false
}

/** Applica una riga listino Odoo al listino base (euro). Null se la riga non è calcolabile. */
export function applyPricelistItemToListPriceEuros(
  listPriceEuros: number,
  item: OdooPricelistItemRow,
): number | null {
  const minQty = Number(item.min_quantity ?? 0)
  if (minQty > 1) return null

  const compute = item.compute_price
  if (compute === 'fixed') {
    if (item.fixed_price == null) return null
    const fixed = Number(item.fixed_price)
    return Number.isFinite(fixed) ? fixed : null
  }
  if (compute === 'percentage') {
    const pct = Number(item.percent_price ?? 0)
    if (!Number.isFinite(pct)) return null
    return listPriceEuros * (1 - pct / 100)
  }
  if (compute === 'formula') {
    const discount = Number(item.price_discount ?? 0)
    const surcharge = Number(item.price_surcharge ?? 0)
    if (!Number.isFinite(discount) || !Number.isFinite(surcharge)) return null
    return listPriceEuros * (1 - discount / 100) + surcharge
  }
  return null
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}
