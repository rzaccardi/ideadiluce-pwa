import {
  formatOdooTemplateRef,
  formatOdooVariantRef,
  parseOdooTemplateId,
  parseOdooVariantId,
} from '../catalog/odooRef.js'
import { parseCartLineVariantMeta } from './cart-line-variant-meta.js'

/** Normalizza variantRef a id numerico stringa (`VAR-88` → `88`). */
export function normalizeCartVariantRef(value: string | null | undefined): string | null {
  if (value == null) return null
  const parsed = parseOdooVariantId(value)
  if (parsed != null) return formatOdooVariantRef(parsed)
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

/** Chiave prodotto stabile: template Odoo se riconoscibile, altrimenti ref così com’è. */
export function normalizeCartProductRef(productRef: string): string {
  const trimmed = productRef.trim()
  const templateId = parseOdooTemplateId(trimmed)
  return templateId != null ? formatOdooTemplateRef(templateId) : trimmed
}

export type CartLineIdentityInput = {
  productRef: string
  variantRef: string | null
  /** Slug noto (hint / metadata) per accorpare slug legacy vs template id. */
  productSlug?: string | null
  metadataJson?: unknown
}

function lineSlugs(line: CartLineIdentityInput): Set<string> {
  const slugs = new Set<string>()
  const meta = parseCartLineVariantMeta(line.metadataJson)
  if (meta?.productSlug?.trim()) slugs.add(meta.productSlug.trim())
  if (line.productSlug?.trim()) slugs.add(line.productSlug.trim())
  const asTemplate = parseOdooTemplateId(line.productRef)
  // productRef non numerico → trattalo come slug legacy.
  if (asTemplate == null && line.productRef.trim()) slugs.add(line.productRef.trim())
  return slugs
}

export function cartProductIdentityMatch(
  line: CartLineIdentityInput,
  candidate: CartLineIdentityInput,
): boolean {
  const lineRef = normalizeCartProductRef(line.productRef)
  const candidateRef = normalizeCartProductRef(candidate.productRef)
  if (lineRef === candidateRef) return true

  const lineTid = parseOdooTemplateId(line.productRef)
  const candidateTid = parseOdooTemplateId(candidate.productRef)
  if (lineTid != null && candidateTid != null && lineTid === candidateTid) return true

  const lineSlugSet = lineSlugs(line)
  const candidateSlugSet = lineSlugs(candidate)
  for (const slug of candidateSlugSet) {
    if (lineSlugSet.has(slug)) return true
  }
  return false
}

/**
 * True se le varianti sono la stessa SKU, oppure una riga non ha variante esplicita
 * (add da card/lista senza variantRef) e va accorpata.
 */
export function cartVariantIdentityMatch(
  lineVariantRef: string | null | undefined,
  candidateVariantRef: string | null | undefined,
): boolean {
  const lineVariant = normalizeCartVariantRef(lineVariantRef)
  const candidateVariant = normalizeCartVariantRef(candidateVariantRef)
  if (lineVariant == null || candidateVariant == null) return true
  return lineVariant === candidateVariant
}

export function cartLineIdentityMatch(
  line: CartLineIdentityInput,
  candidate: CartLineIdentityInput,
): boolean {
  return (
    cartProductIdentityMatch(line, candidate) &&
    cartVariantIdentityMatch(line.variantRef, candidate.variantRef)
  )
}

/**
 * Sceglie la riga da aggiornare: preferisci match variante normalizzata esatta,
 * poi soft-match con variantRef null.
 */
export function findMergableCartLine<T extends CartLineIdentityInput>(
  items: readonly T[],
  candidate: CartLineIdentityInput,
): T | undefined {
  const normalizedCandidateVariant = normalizeCartVariantRef(candidate.variantRef)

  const exact = items.find((item) => {
    if (!cartProductIdentityMatch(item, candidate)) return false
    const itemVariant = normalizeCartVariantRef(item.variantRef)
    if (normalizedCandidateVariant == null) {
      // Add senza variante: qualsiasi riga dello stesso prodotto.
      return true
    }
    return itemVariant === normalizedCandidateVariant
  })
  if (exact) return exact

  if (normalizedCandidateVariant == null) return undefined

  // Stesso prodotto con riga legacy senza variante.
  return items.find(
    (item) =>
      cartProductIdentityMatch(item, candidate) && normalizeCartVariantRef(item.variantRef) == null,
  )
}

export type CoalescedCartLine<T extends CartLineIdentityInput & { id: string; quantity: number }> = {
  keep: T
  quantity: number
  removeIds: string[]
  /** Ref canonici da persistare sulla riga tenuta. */
  productRef: string
  variantRef: string | null
}

/** Raggruppa duplicati equivalenti (stesso SKU) già presenti nel carrello. */
export function planCoalesceDuplicateCartLines<
  T extends CartLineIdentityInput & { id: string; quantity: number },
>(items: readonly T[]): CoalescedCartLine<T>[] {
  const used = new Set<string>()
  const plans: CoalescedCartLine<T>[] = []

  for (let i = 0; i < items.length; i += 1) {
    const head = items[i]
    if (!head || used.has(head.id)) continue
    used.add(head.id)

    const group = [head]
    for (let j = i + 1; j < items.length; j += 1) {
      const other = items[j]
      if (!other || used.has(other.id)) continue
      if (!cartLineIdentityMatch(head, other)) continue
      used.add(other.id)
      group.push(other)
    }

    if (group.length === 1) continue

    const quantity = group.reduce((sum, line) => sum + line.quantity, 0)
    let productRef = normalizeCartProductRef(head.productRef)
    let variantRef = normalizeCartVariantRef(head.variantRef)
    for (const line of group) {
      const tid = parseOdooTemplateId(line.productRef)
      if (tid != null) productRef = formatOdooTemplateRef(tid)
      const normalizedVariant = normalizeCartVariantRef(line.variantRef)
      if (variantRef == null && normalizedVariant != null) variantRef = normalizedVariant
    }

    plans.push({
      keep: head,
      quantity,
      removeIds: group.slice(1).map((line) => line.id),
      productRef,
      variantRef,
    })
  }

  return plans
}
