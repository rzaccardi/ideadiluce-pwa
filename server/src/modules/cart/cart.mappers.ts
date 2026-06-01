import type { Cart, CartItem } from '@prisma/client'
import type { CartDTO, CartItemDTO } from '../../types/dto.js'

function unitForLine(line: CartItem, catalogUnitCents: number | null): number | null {
  if (line.clientUnitPriceEstimate != null) return line.clientUnitPriceEstimate
  return catalogUnitCents
}

export function mapCartToDTO(
  cart: Cart & { items: CartItem[] },
  priceLookup: Map<string, number>,
  displayLookup: Map<string, { slug: string; name: string }> = new Map(),
): CartDTO {
  const items: CartItemDTO[] = cart.items.map((line) => {
    const cat = priceLookup.get(line.productRef) ?? null
    const unit = unitForLine(line, cat)
    const lineTotal = unit != null ? unit * line.quantity : null
    const display = displayLookup.get(line.productRef)
    return {
      id: line.id,
      productRef: line.productRef,
      variantRef: line.variantRef,
      quantity: line.quantity,
      clientUnitPriceEstimateCents: line.clientUnitPriceEstimate,
      lineTotalEstimateCents: lineTotal,
      productSlug: display?.slug ?? line.productRef,
      productName: display?.name ?? line.productRef,
    }
  })

  const withTotals = items.filter((i) => i.lineTotalEstimateCents != null)
  const subtotal =
    withTotals.length === items.length
      ? withTotals.reduce((s, i) => s + (i.lineTotalEstimateCents as number), 0)
      : null

  return {
    id: cart.id,
    currencyCode: cart.currencyCode,
    status: cart.status,
    items,
    estimatedSubtotal: cart.estimatedSubtotal ?? subtotal,
    estimatedTax: cart.estimatedTax,
    estimatedShipping: cart.estimatedShipping,
    estimatedTotal:
      cart.estimatedTotal ??
      (subtotal != null ? subtotal + (cart.estimatedTax ?? 0) + (cart.estimatedShipping ?? 0) : null),
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
  }
}
