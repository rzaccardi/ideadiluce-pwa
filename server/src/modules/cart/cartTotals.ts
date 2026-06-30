/** Subtotale da righe carrello (centesimi). null se manca il prezzo su almeno una riga. */
export function subtotalCentsFromCartItems(
  items: Array<{ quantity: number; clientUnitPriceEstimate: number | null }>,
): number | null {
  if (items.length === 0) return 0
  let sum = 0
  for (const line of items) {
    if (line.clientUnitPriceEstimate == null) return null
    sum += line.clientUnitPriceEstimate * line.quantity
  }
  return sum
}

/**
 * Totali persistiti validi solo se valorizzati (lastPricedAt) e non "zeri fantasma"
 * dopo svuota carrello con righe ancora/prezzi da catalogo.
 */
export function usePersistedCartTotals(
  cart: { estimatedSubtotal: number | null; lastPricedAt: Date | null },
  computedSubtotal: number | null,
): boolean {
  if (cart.lastPricedAt == null || cart.estimatedSubtotal == null) return false
  if (cart.estimatedSubtotal === 0 && (computedSubtotal ?? 0) > 0) return false
  // Totali Odoo obsoleti dopo rimozione/modifica righe: preferisci il subtotale dalle righe.
  if (computedSubtotal != null && computedSubtotal !== cart.estimatedSubtotal) return false
  return true
}

export function resolveCartEstimateTotals(
  cart: {
    estimatedSubtotal: number | null
    estimatedTax: number | null
    estimatedShipping: number | null
    estimatedTotal: number | null
    lastPricedAt: Date | null
  },
  computedSubtotal: number | null,
  computedTax?: number | null,
): {
  estimatedSubtotal: number | null
  estimatedTax: number | null
  estimatedShipping: number | null
  estimatedTotal: number | null
} {
  if (usePersistedCartTotals(cart, computedSubtotal)) {
    return {
      estimatedSubtotal: cart.estimatedSubtotal,
      estimatedTax: cart.estimatedTax,
      estimatedShipping: cart.estimatedShipping,
      estimatedTotal: cart.estimatedTotal,
    }
  }

  const subtotal = computedSubtotal
  const tax =
    computedTax != null
      ? computedTax
      : cart.estimatedTax != null
        ? cart.estimatedTax
        : subtotal != null
          ? null
          : null
  const shipping = cart.estimatedShipping
  const total =
    subtotal != null && tax != null
      ? subtotal + tax + (shipping ?? 0)
      : subtotal != null && cart.estimatedTotal != null
        ? cart.estimatedTotal
        : null

  return {
    estimatedSubtotal: subtotal,
    estimatedTax: tax,
    estimatedShipping: shipping,
    estimatedTotal: total,
  }
}

export function effectiveSubtotalCents(cart: {
  estimatedSubtotal: number | null
  lastPricedAt: Date | null
  items: Array<{ quantity: number; clientUnitPriceEstimate: number | null }>
}): number {
  const computed = subtotalCentsFromCartItems(cart.items)
  if (usePersistedCartTotals(cart, computed) && cart.estimatedSubtotal != null) {
    return cart.estimatedSubtotal
  }
  return computed ?? 0
}
