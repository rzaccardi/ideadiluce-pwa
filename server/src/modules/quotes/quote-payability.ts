export type QuotePayableReason =
  | 'payable'
  | 'expired'
  | 'not_sent'
  | 'cancelled'
  | 'converted'
  | 'draft'

export type QuotePayability = {
  payable: boolean
  reason: QuotePayableReason
  expired: boolean
}

function startOfTodayUtc(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/** Scaduto se validity_date è prima di oggi (UTC). */
export function isQuoteValidityExpired(validityDate: string | null | undefined): boolean {
  if (!validityDate?.trim()) return false
  const target = new Date(validityDate)
  if (Number.isNaN(target.getTime())) return false
  return target < startOfTodayUtc()
}

export function resolveOdooQuotePayability(input: {
  state: string
  validityDate?: string | null
}): QuotePayability {
  const state = input.state.toLowerCase()
  const expired = isQuoteValidityExpired(input.validityDate)

  if (state === 'cancel') {
    return { payable: false, reason: 'cancelled', expired: false }
  }
  if (state === 'sale' || state === 'done') {
    return { payable: false, reason: 'converted', expired: false }
  }
  if (state === 'draft') {
    return { payable: false, reason: 'draft', expired }
  }
  if (state !== 'sent') {
    return { payable: false, reason: 'not_sent', expired }
  }
  if (expired) {
    return { payable: false, reason: 'expired', expired: true }
  }
  return { payable: true, reason: 'payable', expired: false }
}

export function quotePayabilityUserMessage(reason: QuotePayableReason): string {
  switch (reason) {
    case 'expired':
      return 'Questo preventivo è scaduto. Contattaci per un nuovo preventivo.'
    case 'cancelled':
      return 'Questo preventivo è stato annullato.'
    case 'converted':
      return 'Questo preventivo è già stato convertito in ordine.'
    case 'draft':
      return 'Il preventivo è ancora in preparazione e non è pagabile online.'
    case 'not_sent':
      return 'Questo preventivo non è ancora approvato per il pagamento online.'
    default:
      return 'Questo preventivo non è pagabile online.'
  }
}

export function quotePayabilityErrorCode(reason: QuotePayableReason): string {
  switch (reason) {
    case 'expired':
      return 'QUOTE_EXPIRED'
    case 'cancelled':
      return 'QUOTE_CANCELLED'
    case 'converted':
      return 'QUOTE_CONVERTED'
    case 'draft':
      return 'QUOTE_DRAFT'
    default:
      return 'QUOTE_NOT_PAYABLE'
  }
}

/** @deprecated Usa resolveOdooQuotePayability */
export function isOdooQuotePayable(state: string, validityDate?: string | null): boolean {
  return resolveOdooQuotePayability({ state, validityDate }).payable
}
