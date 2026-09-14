import type { StripeLineItemInput } from '../../adapters/payments/stripeCheckoutAdapter.js'

export const STRIPE_AMOUNT_TOLERANCE_CENTS = 2

export function sumStripeLineItems(lines: StripeLineItemInput[]): number {
  return lines.reduce((sum, line) => sum + line.amountCents * line.quantity, 0)
}

export function stripeAmountsMatch(a: number, b: number): boolean {
  return Math.abs(a - b) <= STRIPE_AMOUNT_TOLERANCE_CENTS
}

/**
 * Stripe deve addebitare esattamente il totale PWA (IVA inclusa).
 * Le righe carrello sono al netto: se manca l’imposta, si aggiunge una riga IVA.
 */
export function alignStripeLineItems(input: {
  lines: StripeLineItemInput[]
  amountCents: number
  currencyCode: string
  taxLabel?: string | null
}): StripeLineItemInput[] {
  const amountCents = Math.round(input.amountCents)
  const currencyCode = input.currencyCode
  const validLines = input.lines.filter((line) => line.amountCents > 0 && line.quantity > 0)
  const sum = sumStripeLineItems(validLines)

  if (amountCents <= 0) return validLines
  if (validLines.length > 0 && sum === amountCents) return validLines

  if (validLines.length > 0 && sum < amountCents) {
    return [
      ...validLines,
      {
        name: input.taxLabel?.trim() || 'IVA',
        amountCents: amountCents - sum,
        quantity: 1,
        currencyCode,
        metadata: { kind: 'tax_or_adjustment' },
      },
    ]
  }

  return [
    {
      name: 'Ordine',
      amountCents,
      quantity: 1,
      currencyCode,
    },
  ]
}
