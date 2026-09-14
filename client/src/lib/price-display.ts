import type { ImpersonationInfoDTO, PriceDisplayModeDTO, UserDTO } from '@/types/dto'
import { usesSessionPricelist } from '@/lib/catalog-pricing'
import { formatMoney } from '@/lib/format'

/** Aliquota vetrina Italia — stesso arrotondamento del tax service. */
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

/** Retail/guest: vetrina IVA inclusa. Listino sessione B2B/pro: IVA esclusa. */
export function displaysCatalogPriceIncVat(
  user?: UserDTO | null,
  impersonation?: ImpersonationInfoDTO | null,
): boolean {
  return !usesSessionPricelist(user, impersonation)
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
