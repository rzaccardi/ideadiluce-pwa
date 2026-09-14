import { describe, expect, it } from 'vitest'
import { shouldFinalizeStripeOnThankYou } from './checkout-payment-result'

describe('shouldFinalizeStripeOnThankYou', () => {
  it('finalizza Stripe se c’è session_id in query', () => {
    expect(
      shouldFinalizeStripeOnThankYou({
        hasStripeReturnParams: true,
        paymentMethod: 'bank_transfer',
      }),
    ).toBe(true)
  })

  it('non chiama Stripe return su un ordine bonifico senza session Stripe', () => {
    expect(
      shouldFinalizeStripeOnThankYou({
        hasStripeReturnParams: false,
        paymentMethod: 'bank_transfer',
      }),
    ).toBe(false)
  })

  it('finalizza per orderId quando il metodo è carta', () => {
    expect(
      shouldFinalizeStripeOnThankYou({
        hasStripeReturnParams: false,
        paymentMethod: 'stripe',
      }),
    ).toBe(true)
  })
})
