import type { CartItemDTO } from '@/types/dto'

/** Quantità totale in carrello per prodotto (tutte le varianti). */
export function getProductCartQuantity(
  items: readonly CartItemDTO[] | undefined,
  productRef: string,
): number {
  if (!items?.length) return 0
  return items
    .filter((i) => i.productRef === productRef || i.productSlug === productRef)
    .reduce((sum, i) => sum + i.quantity, 0)
}
