import type { ImpersonationInfoDTO, PriceDisplayModeDTO, UserDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'

/** Aliquota vetrina Italia: stesso arrotondamento del tax service. */
export const CATALOG_VAT_RATE_PCT = 22

export function catalogVatCentsFromNet(netCents: number, ratePct = CATALOG_VAT_RATE_PCT): number {
  if (!Number.isFinite(netCents) || netCents <= 0) return 0
  return Math.round((netCents * ratePct) / 100)
}

/** Prezzo lordo da netto di listino (IVA 22% inclusa). */
export function catalogGrossCents(netCents: number, ratePct = CATALOG_VAT_RATE_PCT): number {
  if (!Number.isFinite(netCents)) return 0
  if (netCents <= 0) return netCents
  return netCents + catalogVatCentsFromNet(netCents, ratePct)
}

/** Account con listino professional: prezzi netti e didascalia IVA esclusa. */
export function isB2bProfessionalUser(user?: UserDTO | null): boolean {
  if (!user) return false
  return user.isProfessional || user.customerSegment === 'professional'
}

/**
 * Vetrina IVA inclusa per guest, retail e business.
 * Solo i B2B Professional vedono il netto con «IVA esclusa».
 * `impersonation` resta in firma per i chiamanti del listino sessione.
 */
export function displaysCatalogPriceIncVat(
  user?: UserDTO | null,
  _impersonation?: ImpersonationInfoDTO | null,
): boolean {
  return !isB2bProfessionalUser(user)
}

export type CatalogPriceCaptionKey = 'product.price.vatIncluded' | 'product.price.vatExcluded'

export type CatalogPriceDisplay = {
  cents: number
  vatCents: number
  vatIncluded: boolean
  captionKey: CatalogPriceCaptionKey
}

export function resolveCatalogPriceDisplay(
  netCents: number,
  user?: UserDTO | null,
  impersonation?: ImpersonationInfoDTO | null,
): CatalogPriceDisplay {
  const vatIncluded = displaysCatalogPriceIncVat(user, impersonation)
  const vatCents = catalogVatCentsFromNet(netCents)
  return {
    cents: vatIncluded ? netCents + vatCents : netCents,
    vatCents,
    vatIncluded,
    captionKey: vatIncluded ? 'product.price.vatIncluded' : 'product.price.vatExcluded',
  }
}

export function formatCatalogMoney(
  netCents: number,
  currency: string,
  user?: UserDTO | null,
  impersonation?: ImpersonationInfoDTO | null,
): string {
  return formatMoney(resolveCatalogPriceDisplay(netCents, user, impersonation).cents, currency)
}

/** Etichetta statica (test / fallback): `ex_vat` → IVA esclusa. */
export function formatPriceDisplayModeLabel(mode?: PriceDisplayModeDTO | null): string | null {
  if (mode === 'ex_vat') return 'IVA esclusa'
  return null
}

/** True se il listino pieno va mostrato barrato. */
export function shouldShowListPriceStrike(
  netCents: number,
  listPriceCents?: number | null,
): boolean {
  return listPriceCents != null && Number.isFinite(listPriceCents) && listPriceCents > netCents
}

/** Format badge −X% (es. 10.5 → "10.5"). */
export function formatDiscountPctLabel(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '')
}
