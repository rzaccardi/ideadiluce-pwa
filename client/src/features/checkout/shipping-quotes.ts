import type { FreeShippingHintDTO, ShippingQuoteDTO } from '@/types/dto'

export function isFreeShippingQuote(quote: ShippingQuoteDTO) {
  return quote.source === 'free'
}

export function isPickupQuote(quote: ShippingQuoteDTO) {
  return quote.source === 'pickup'
}

function sortShippingQuotes(quotes: ShippingQuoteDTO[]) {
  return [...quotes].sort((a, b) => {
    const aFree = isFreeShippingQuote(a) ? 0 : 1
    const bFree = isFreeShippingQuote(b) ? 0 : 1
    return aFree - bFree
  })
}

/** Quote visibili in checkout: con spedizione gratuita restano solo consegna gratuita e ritiro in negozio. */
export function filterVisibleShippingQuotes(
  quotes: ReadonlyArray<ShippingQuoteDTO>,
  _hint?: FreeShippingHintDTO | null,
): ShippingQuoteDTO[] {
  const sorted = sortShippingQuotes([...quotes])
  if (!sorted.some(isFreeShippingQuote)) return sorted
  return sorted.filter((q) => isFreeShippingQuote(q) || isPickupQuote(q))
}

export function isShippingQuoteSelectable(
  quote: ShippingQuoteDTO,
  selectionLocked: boolean,
) {
  if (!selectionLocked) return true
  return isFreeShippingQuote(quote) || isPickupQuote(quote)
}

export function isFreeShippingLocked(
  quotes: ReadonlyArray<ShippingQuoteDTO>,
  hint: FreeShippingHintDTO | null | undefined,
) {
  return Boolean(hint?.eligible && quotes.some(isFreeShippingQuote))
}

export function isRomePickupEligible(address: {
  city: string
  postalCode: string
  country: string
}): boolean {
  if (address.country.toUpperCase() !== 'IT') return false
  const city = address.city.trim().toLowerCase()
  if (city !== 'roma' && city !== 'rome') return false
  const pc = address.postalCode.replace(/\s/g, '')
  return /^001\d{2}$/.test(pc)
}
