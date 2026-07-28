import type { ProductAvailabilityDataDTO, ProductVariantDTO } from '@/types/dto'

/** Nomi attributo unici nell’ordine di prima apparizione. */
export function attributeNames(variants: ReadonlyArray<ProductVariantDTO>): string[] {
  const names = new Set<string>()
  for (const v of variants) {
    for (const a of v.attributes) {
      if (a.name?.trim()) names.add(a.name)
    }
  }
  return [...names]
}

export function uniqueValuesForAttr(
  variants: ReadonlyArray<ProductVariantDTO>,
  attrName: string,
): string[] {
  const values: string[] = []
  const seen = new Set<string>()
  for (const v of variants) {
    const value = v.attributes.find((a) => a.name === attrName)?.value?.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    values.push(value)
  }
  return values
}

/** Valore tipo misura (es. `22 cm`, `Ø 30`, `1.2 m`). */
export function isMeasurementValue(value: string): boolean {
  return /^\s*\d+([.,]\d+)?\s*(cm|mm|m|Ø|ø|"|′|″)?\s*$/i.test(value.trim())
}

export type AttributeValueSubgroup = {
  /** Titolo UI del sottogruppo. */
  title: string
  values: string[]
}

/**
 * Se un unico attributo Odoo mescola misure e configurazioni (es. `22 cm` + `Cluster Linear`),
 * spezza in sottogruppi UI. Resta un solo asse di selezione (valori mutuamente esclusivi).
 */
export function subgroupAttributeValues(
  attrName: string,
  values: readonly string[],
): AttributeValueSubgroup[] {
  const list = values.map((v) => v.trim()).filter(Boolean)
  if (list.length < 2) return [{ title: attrName, values: list }]

  const measures = list.filter(isMeasurementValue)
  const others = list.filter((v) => !isMeasurementValue(v))
  if (!measures.length || !others.length) {
    return [{ title: attrName, values: list }]
  }

  const measureTitle = /dimensioni|misur|size|diametro|altezza|largh|ingombr/i.test(attrName)
    ? attrName
    : 'Dimensioni'
  const otherTitle = /versione|config|modello|tipo|cluster|composizione/i.test(attrName)
    ? attrName
    : 'Configurazione'

  return [
    { title: measureTitle, values: measures },
    { title: otherTitle, values: others },
  ]
}

/** Attributi colore/finitura → swatch; gli altri → chip (es. Versione). */
export function isSwatchAttribute(name: string): boolean {
  return /finitura|colore|color|finish|colour/i.test(name) && !/luce|kelvin|temperatura/i.test(name)
}

function matchesDesiredAttributes(
  variant: ProductVariantDTO,
  desired: ReadonlyMap<string, string>,
): boolean {
  return [...desired.entries()].every(([name, value]) =>
    variant.attributes.some((a) => a.name === name && a.value === value),
  )
}

/** Variante acquistabile (stock o ordinabile). */
export function isVariantPurchasable(variant: ProductVariantDTO): boolean {
  const avail: ProductAvailabilityDataDTO | undefined = variant.availability
  if (avail) {
    if (avail.isUnrecoverable === true) return false
    if (avail.qtyAvailable > 0) return true
    return avail.isOrderable === true
  }
  if (variant.inStock === false) return false
  if (variant.stockQty != null) return variant.stockQty > 0
  return true
}

function preferPurchasable(variants: ProductVariantDTO[]): ProductVariantDTO | undefined {
  return variants.find(isVariantPurchasable) ?? variants[0]
}

/**
 * Aggiorna un asse tenendo gli altri della variante corrente.
 * Preferisce match esatto acquistabile; altrimenti fallback parziale.
 */
export function pickVariantForAttribute(
  variants: ReadonlyArray<ProductVariantDTO>,
  selectedRef: string,
  attrName: string,
  newValue: string,
): string {
  const current = variants.find((v) => v.ref === selectedRef) ?? variants[0]
  const desired = new Map(current.attributes.map((a) => [a.name, a.value]))
  desired.set(attrName, newValue)

  const exactMatches = variants.filter((v) => matchesDesiredAttributes(v, desired))
  const exact = preferPurchasable(exactMatches)
  if (exact) return exact.ref

  const partialMatches = variants.filter((v) =>
    v.attributes.some((a) => a.name === attrName && a.value === newValue),
  )
  const partial = preferPurchasable(partialMatches)
  return partial?.ref ?? current.ref
}

export type MatrixValueState = 'available' | 'out_of_stock' | 'unavailable'

/**
 * Stato di un valore nella matrice rispetto alla selezione corrente:
 * - `available` — esiste combinazione esatta acquistabile
 * - `out_of_stock` — esiste ma non acquistabile
 * - `unavailable` — combinazione assente (asse multiplo)
 */
export function getMatrixValueState(
  variants: ReadonlyArray<ProductVariantDTO>,
  selectedRef: string,
  attrName: string,
  value: string,
): MatrixValueState {
  const current = variants.find((v) => v.ref === selectedRef) ?? variants[0]
  const desired = new Map(current.attributes.map((a) => [a.name, a.value]))
  desired.set(attrName, value)

  const exactMatches = variants.filter((v) => matchesDesiredAttributes(v, desired))
  if (exactMatches.length > 0) {
    return exactMatches.some(isVariantPurchasable) ? 'available' : 'out_of_stock'
  }

  // Un solo asse: ogni valore corrisponde a una variante (niente “combinazione assente”).
  const axisCount = attributeNames(variants).length
  if (axisCount <= 1) {
    const partial = variants.filter((v) =>
      v.attributes.some((a) => a.name === attrName && a.value === value),
    )
    if (!partial.length) return 'unavailable'
    return partial.some(isVariantPurchasable) ? 'available' : 'out_of_stock'
  }

  return 'unavailable'
}
