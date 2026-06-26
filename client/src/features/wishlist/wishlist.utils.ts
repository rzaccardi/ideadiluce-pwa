import type { WishlistItemDTO } from '@/types/dto'

export function isProductInWishlist(
  items: readonly WishlistItemDTO[],
  productRef: string,
  variantRef?: string | null,
) {
  if (variantRef === undefined) {
    return items.some((i) => i.productRef === productRef)
  }
  const variant = variantRef ?? null
  return items.some((i) => i.productRef === productRef && (i.variantRef ?? null) === variant)
}
