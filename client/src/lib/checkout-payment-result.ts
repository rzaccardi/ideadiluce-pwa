/** Stripe return va chiamato solo per pagamenti carta, non per il bonifico. */
export function shouldFinalizeStripeOnThankYou(input: {
  hasStripeReturnParams: boolean
  paymentMethod: string | null
}): boolean {
  if (input.hasStripeReturnParams) return true
  return input.paymentMethod === 'stripe'
}
