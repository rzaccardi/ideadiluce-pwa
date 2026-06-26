import type { CartDTO, CartItemDTO } from '@/types/dto'

type CartLike = Omit<CartDTO, 'items' | 'warnings'> & {
  items: ReadonlyArray<CartItemDTO>
  warnings?: ReadonlyArray<string>
}

function isPurchasableLine(line: CartItemDTO): boolean {
  return line.availabilityStatus !== 'blocked' && line.purchasable !== false
}

function purchasableLines(cart: CartLike): ReadonlyArray<CartItemDTO> {
  return cart.items.filter(isPurchasableLine)
}

export function cartHasBlockedLines(cart: CartLike): boolean {
  return cart.items.some((line) => line.availabilityStatus === 'blocked')
}

function subtotalFromLines(cart: CartLike): number {
  return purchasableLines(cart).reduce((s, i) => s + (i.lineTotalEstimateCents ?? 0), 0)
}

function shouldUsePersistedSubtotal(cart: CartLike, fromLines: number): boolean {
  if (cart.estimatedSubtotal == null) return false
  if (cart.estimatedSubtotal === 0 && fromLines > 0) return false
  return true
}

export function cartSubtotalCents(cart: CartLike): number {
  const fromLines = subtotalFromLines(cart)
  return shouldUsePersistedSubtotal(cart, fromLines) ? cart.estimatedSubtotal! : fromLines
}

export function cartShippingCents(
  cart: CartLike,
  selectedShippingAmountCents?: number | null,
): number {
  if (selectedShippingAmountCents != null) return selectedShippingAmountCents
  return cart.estimatedShipping ?? 0
}

export function cartTaxCents(cart: CartLike, liveTax?: { taxCents: number } | null): number {
  if (liveTax?.taxCents != null) return liveTax.taxCents
  if (cart.taxBreakdown?.taxCents != null) return cart.taxBreakdown.taxCents
  const fromLines = subtotalFromLines(cart)
  if (shouldUsePersistedSubtotal(cart, fromLines) && cart.estimatedTax != null) {
    return cart.estimatedTax
  }
  if (cart.taxBreakdown?.taxRatePct != null) {
    const subtotal = cartSubtotalCents(cart)
    return Math.round((subtotal * cart.taxBreakdown.taxRatePct) / 100)
  }
  return cart.estimatedTax ?? 0
}

export function cartTotalCents(
  cart: CartLike,
  selectedShippingAmountCents?: number | null,
  liveTax?: { taxCents: number; netCents?: number } | null,
): number {
  const subtotal = liveTax?.netCents ?? cartSubtotalCents(cart)
  const tax = cartTaxCents(cart, liveTax)
  const shipping = cartShippingCents(cart, selectedShippingAmountCents)
  const fromLines = subtotalFromLines(cart)
  const persisted = shouldUsePersistedSubtotal(cart, fromLines)
  if (
    !liveTax &&
    persisted &&
    cart.estimatedTotal != null &&
    !(cart.estimatedTotal === 0 && fromLines > 0)
  ) {
    return cart.estimatedTotal
  }
  return subtotal + tax + shipping
}

export function cartPurchasableItemCount(cart: CartLike): number {
  return purchasableLines(cart).reduce((n, i) => n + i.quantity, 0)
}
