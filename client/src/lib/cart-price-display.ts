import type { CartDTO, CartItemDTO, ImpersonationInfoDTO, UserDTO } from '@/types/dto'
import {
  CATALOG_VAT_RATE_PCT,
  catalogGrossCents,
  displaysCatalogPriceIncVat,
  resolveCatalogPriceDisplay,
} from '@/lib/price-display'
import { cartSubtotalCents, cartTaxCents, cartTotalCents } from '@/lib/cartTotals'

type CartLike = Omit<CartDTO, 'items' | 'warnings'> & {
  items: ReadonlyArray<CartItemDTO>
  warnings?: ReadonlyArray<string>
}

/** Prezzo riga/listino netto → importo da mostrare (lordo per guest/retail/business). */
export function cartLineDisplayCents(
  netCents: number,
  user?: UserDTO | null,
  impersonation?: ImpersonationInfoDTO | null,
): number {
  return resolveCatalogPriceDisplay(netCents, user, impersonation).cents
}

/**
 * Subtotale UI: per vetrina IVA inclusa è netto+IVA (stesso arrotondamento della scheda prodotto).
 * Usa taxBreakdown/estimatedTax se presenti; altrimenti stima catalogo 22%.
 */
export function cartDisplaySubtotalCents(
  cart: CartLike,
  user?: UserDTO | null,
  impersonation?: ImpersonationInfoDTO | null,
  liveTax?: { taxCents: number; netCents?: number } | null,
): number {
  const net = liveTax?.netCents ?? cartSubtotalCents(cart)
  if (!displaysCatalogPriceIncVat(user, impersonation)) return net
  const hasTaxSignal =
    liveTax != null || cart.taxBreakdown != null || cart.estimatedTax != null
  if (hasTaxSignal) return net + cartTaxCents(cart, liveTax)
  return catalogGrossCents(net)
}

/** Headline riepilogo checkout: totale da pagare (con IVA) nelle fasi finali; altrimenti subtotale display. */
export function cartCheckoutHeadlineCents(
  cart: CartLike,
  options: {
    user?: UserDTO | null
    impersonation?: ImpersonationInfoDTO | null
    selectedShippingAmountCents?: number | null
    liveTax?: { taxCents: number; netCents?: number } | null
    revealGrandTotal?: boolean
  },
): number {
  if (options.revealGrandTotal) {
    return cartTotalCents(cart, options.selectedShippingAmountCents, options.liveTax)
  }
  return cartDisplaySubtotalCents(cart, options.user, options.impersonation, options.liveTax)
}

export function cartDisplayVatRatePct(
  cart: CartLike,
  liveTax?: { taxRatePct?: number } | null,
): number {
  return liveTax?.taxRatePct ?? cart.taxBreakdown?.taxRatePct ?? CATALOG_VAT_RATE_PCT
}
