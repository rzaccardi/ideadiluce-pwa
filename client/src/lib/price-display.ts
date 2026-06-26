import type { PriceDisplayModeDTO } from '@/types/dto'

/** Etichetta prezzo netto (es. IVA esclusa) per card e PDP. */
export function formatPriceDisplayModeLabel(mode?: PriceDisplayModeDTO | null): string | null {
  if (mode === 'ex_vat') return 'IVA esclusa'
  return null
}
