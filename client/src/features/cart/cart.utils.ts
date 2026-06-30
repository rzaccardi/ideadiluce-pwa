import type { CartItemDTO } from '@/types/dto'
import { stripLocalePrefix } from '@/lib/locale'

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

function normalizeStorefrontPath(pathname: string): string {
  const path = stripLocalePrefix(pathname)
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

/** Pagina carrello (path senza prefisso lingua). */
export function isCartPagePath(pathname: string): boolean {
  const normalized = normalizeStorefrontPath(pathname)
  return normalized === '/cart' || normalized === '/carrello'
}

/** Carrello o checkout (path senza prefisso lingua). */
export function isCartFlowPath(pathname: string): boolean {
  const normalized = normalizeStorefrontPath(pathname)
  return isCartPagePath(pathname) || normalized.startsWith('/checkout')
}
