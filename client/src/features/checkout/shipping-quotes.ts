import type { FreeShippingHintDTO, ShippingQuoteDTO } from '@/types/dto'

export function isFreeShippingQuote(quote: ShippingQuoteDTO) {
  return quote.source === 'free'
}

function sortShippingQuotes(quotes: ShippingQuoteDTO[]) {
  return [...quotes].sort((a, b) => {
    const aFree = isFreeShippingQuote(a) ? 0 : 1
    const bFree = isFreeShippingQuote(b) ? 0 : 1
    return aFree - bFree
  })
}

/** Quote visibili in checkout: gratuita + corrieri a pagamento se sbloccata, altrimenti solo a pagamento. */
export function filterVisibleShippingQuotes(
  quotes: ShippingQuoteDTO[],
  hint: FreeShippingHintDTO | null | undefined,
): ShippingQuoteDTO[] {
  const freeQuotes = quotes.filter(isFreeShippingQuote)
  if (hint?.eligible && freeQuotes.length > 0) {
    return sortShippingQuotes(quotes)
  }
  return sortShippingQuotes(quotes.filter((q) => !isFreeShippingQuote(q)))
}

export function isShippingQuoteSelectable(
  quote: ShippingQuoteDTO,
  selectionLocked: boolean,
) {
  if (!selectionLocked) return true
  return isFreeShippingQuote(quote)
}

export function isFreeShippingLocked(
  quotes: ReadonlyArray<ShippingQuoteDTO>,
  hint: FreeShippingHintDTO | null | undefined,
) {
  return Boolean(hint?.eligible && quotes.some(isFreeShippingQuote))
}

export function isPickupQuote(quote: ShippingQuoteDTO) {
  return quote.source === 'pickup'
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
