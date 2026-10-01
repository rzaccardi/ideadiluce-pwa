import type { CartAddProductHint } from './cart-add-hint'
import type { CartDTO, CartItemDTO, CartReservationDTO } from '@/types/dto'

const OPTIMISTIC_RESERVATION: CartReservationDTO = {
  enabled: false,
  startedAt: null,
  expiresAt: null,
  expiresInSeconds: null,
  elapsedSeconds: null,
  expired: false,
  ttlMinutes: 0,
}

export function isOptimisticCartId(id: string): boolean {
  return id.startsWith('optimistic')
}

function emptyOptimisticCart(): CartDTO {
  return {
    id: 'optimistic',
    currencyCode: 'EUR',
    status: 'ACTIVE',
    items: [],
    estimatedSubtotal: 0,
    estimatedTax: null,
    estimatedShipping: null,
    estimatedTotal: 0,
    itemCount: 0,
    purchasableItemCount: 0,
    warnings: [],
    deliveryLeadDays: null,
    deliveryEstimateDays: null,
    repricedAt: new Date().toISOString(),
    reservation: OPTIMISTIC_RESERVATION,
  }
}

function optimisticAvailability(): CartItemDTO['availability'] {
  return {
    state: 'available',
    stockQty: null,
    effectiveLeadDays: null,
    warning: null,
    isOrderable: false,
  }
}

function normalizeVariantKey(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const legacy = /^VAR-(\d+)$/i.exec(trimmed)
  if (legacy) return legacy[1]
  return trimmed
}

export function cartLineMatchesAdd(
  line: Pick<CartItemDTO, 'productRef' | 'productSlug' | 'variantRef'>,
  productRef: string,
  variantRef: string | null,
  hint?: CartAddProductHint,
): boolean {
  const lineKeys = new Set(
    [line.productRef, line.productSlug].filter((value): value is string => Boolean(value)),
  )
  const inputKeys = new Set([productRef])
  if (hint?.odooTemplateId != null) inputKeys.add(String(hint.odooTemplateId))
  if (hint?.slug) inputKeys.add(hint.slug)
  const productMatch = [...inputKeys].some((key) => lineKeys.has(key))
  if (!productMatch) return false

  const variantHint = hint?.odooVariantId != null ? String(hint.odooVariantId) : null
  const lineVariant = normalizeVariantKey(line.variantRef)
  const inputVariant = normalizeVariantKey(variantRef)
  const hintVariant = normalizeVariantKey(variantHint)

  // Stesso prodotto senza variante esplicita su un lato → accorpa (evita doppie righe).
  if (lineVariant == null || inputVariant == null) return true
  if (lineVariant === inputVariant) return true
  if (hintVariant != null && (lineVariant === hintVariant || inputVariant === hintVariant)) {
    return true
  }
  return false
}

function canonicalizeOptimisticLine(
  line: CartItemDTO,
  variantRef: string | null,
  hint?: CartAddProductHint,
) {
  if (hint?.odooTemplateId != null) {
    line.productRef = String(hint.odooTemplateId)
  }
  if (hint?.slug) {
    line.productSlug = hint.slug
  }
  const nextVariant =
    hint?.odooVariantId != null
      ? String(hint.odooVariantId)
      : normalizeVariantKey(variantRef)
  const currentVariant = normalizeVariantKey(line.variantRef)
  if (currentVariant == null && nextVariant != null) {
    line.variantRef = nextVariant
  } else if (currentVariant != null && nextVariant != null && currentVariant === nextVariant) {
    line.variantRef = nextVariant
  }
}

function resolveOptimisticUnitPrice(
  hint?: CartAddProductHint,
  existing?: CartItemDTO,
): number | null {
  const fromHint = hint?.unitPriceCents
  if (fromHint != null && fromHint > 0) return fromHint
  const fromLine = existing?.clientUnitPriceEstimateCents
  if (fromLine != null && fromLine > 0) return fromLine
  return null
}

function recountCart(cart: CartDTO): CartDTO {
  const items = cart.items
  const itemCount = items.reduce((sum, line) => sum + line.quantity, 0)
  const purchasable = items.filter((line) => line.purchasable !== false)
  const priced = purchasable.filter((line) => line.lineTotalEstimateCents != null)
  const subtotal = priced.reduce((sum, line) => sum + (line.lineTotalEstimateCents ?? 0), 0)
  const tax = cart.estimatedTax ?? 0
  return {
    ...cart,
    itemCount,
    purchasableItemCount: purchasable.reduce((sum, line) => sum + line.quantity, 0),
    estimatedSubtotal: priced.length > 0 ? subtotal : cart.estimatedSubtotal,
    // Non includere spedizione stimata residua nel totale ottimistico.
    estimatedTotal: priced.length > 0 ? subtotal + tax : cart.estimatedTotal,
    estimatedShipping: null,
  }
}

export function applyOptimisticAdd(input: {
  cart: CartDTO | null
  productRef: string
  quantity: number
  variantRef?: string | null
  productHint?: CartAddProductHint
}): CartDTO {
  const variantRef = input.variantRef ?? null
  const hint = input.productHint
  const base: CartDTO = input.cart
    ? {
        ...input.cart,
        items: input.cart.items.map((line) => ({ ...line })),
      }
    : emptyOptimisticCart()

  const existing = base.items.find((line) =>
    cartLineMatchesAdd(line, input.productRef, variantRef, hint),
  )
  const unitPriceCents = resolveOptimisticUnitPrice(hint, existing)

  if (existing) {
    existing.quantity += input.quantity
    canonicalizeOptimisticLine(existing, variantRef, hint)
    if (unitPriceCents != null) {
      existing.clientUnitPriceEstimateCents = unitPriceCents
      existing.lineTotalEstimateCents = unitPriceCents * existing.quantity
    } else if (
      existing.clientUnitPriceEstimateCents != null &&
      existing.clientUnitPriceEstimateCents > 0
    ) {
      existing.lineTotalEstimateCents =
        existing.clientUnitPriceEstimateCents * existing.quantity
    }
    existing.purchasable = true
    existing.availabilityStatus = 'available'
    existing.availability = optimisticAvailability()
    return recountCart(base)
  }

  const productRef = hint?.odooTemplateId != null ? String(hint.odooTemplateId) : input.productRef
  const resolvedVariantRef =
    hint?.odooVariantId != null ? String(hint.odooVariantId) : variantRef
  const attributes = (hint?.attributes ?? [])
    .filter((attribute) => attribute.name?.trim() && attribute.value?.trim())
    .map((attribute) => ({ name: attribute.name.trim(), value: attribute.value.trim() }))

  const line: CartItemDTO = {
    id: `optimistic:${productRef}:${resolvedVariantRef ?? ''}`,
    productRef,
    variantRef: resolvedVariantRef,
    quantity: input.quantity,
    clientUnitPriceEstimateCents: unitPriceCents,
    lineTotalEstimateCents: unitPriceCents != null ? unitPriceCents * input.quantity : null,
    productSlug: hint?.slug ?? input.productRef,
    productName: hint?.name ?? input.productRef,
    imageUrl: hint?.imageUrl ?? null,
    variantLabel: hint?.variantLabel ?? null,
    ...(attributes.length ? { variantAttributes: attributes } : {}),
    purchasable: true,
    availabilityStatus: 'available',
    availability: optimisticAvailability(),
  }

  base.items.push(line)
  return recountCart(base)
}
