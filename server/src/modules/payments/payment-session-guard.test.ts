import { describe, expect, it } from 'vitest'
import {
  canStripeReturnMutateOrder,
  isBankTransferAwaitingPayment,
  shouldRejectIncomingPaymentMethod,
} from './payment-session-guard.js'

describe('payment-session-guard', () => {
  it('riconosce il bonifico in attesa di accredito', () => {
    expect(
      isBankTransferAwaitingPayment({
        paymentMethod: 'BANK_TRANSFER',
        orderStatus: 'PAYMENT_PENDING',
      }),
    ).toBe(true)
    expect(
      isBankTransferAwaitingPayment({
        paymentMethod: 'STRIPE',
        orderStatus: 'PAYMENT_PENDING',
      }),
    ).toBe(false)
  })

  it('non lascia che Stripe return marchi fallito un ordine bonifico', () => {
    expect(
      canStripeReturnMutateOrder({
        paymentMethod: 'BANK_TRANSFER',
        orderStatus: 'PAYMENT_PENDING',
      }),
    ).toBe(false)
    expect(
      canStripeReturnMutateOrder({
        paymentMethod: 'BANK_TRANSFER',
        orderStatus: 'PAYMENT_FAILED',
      }),
    ).toBe(false)
  })

  it('consente Stripe return su un pagamento carta ancora aperto', () => {
    expect(
      canStripeReturnMutateOrder({
        paymentMethod: 'STRIPE',
        orderStatus: 'PAYMENT_STARTED',
      }),
    ).toBe(true)
    expect(
      canStripeReturnMutateOrder({
        paymentMethod: 'STRIPE',
        orderStatus: 'PAYMENT_PENDING',
      }),
    ).toBe(true)
  })

  it('blocca una sessione Stripe arrivata dopo la conferma bonifico', () => {
    expect(
      shouldRejectIncomingPaymentMethod(
        { paymentMethod: 'BANK_TRANSFER', orderStatus: 'PAYMENT_PENDING' },
        'STRIPE',
      ),
    ).toBe(true)
    expect(
      shouldRejectIncomingPaymentMethod(
        { paymentMethod: 'STRIPE', orderStatus: 'PAYMENT_STARTED' },
        'BANK_TRANSFER',
      ),
    ).toBe(false)
  })
})
