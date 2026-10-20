import { describe, expect, it } from 'vitest'
import {
  isPaymentVerifyRetriable,
  isThankYouPaymentSucceeded,
  paymentVerifyMessageKey,
  shouldFinalizeStripeOnThankYou,
} from './checkout-payment-result'

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

describe('paymentVerifyMessageKey', () => {
  it('mappa i codici di verifica pagamento', () => {
    expect(paymentVerifyMessageKey('payment_not_found')).toBe(
      'paymentResult.error.payment_not_found',
    )
    expect(paymentVerifyMessageKey('payment_not_succeeded')).toBe(
      'paymentResult.error.payment_not_succeeded',
    )
    expect(paymentVerifyMessageKey('payment_env_mismatch')).toBe(
      'paymentResult.error.payment_env_mismatch',
    )
    expect(paymentVerifyMessageKey('payment_currency_mismatch')).toBe(
      'paymentResult.error.payment_currency_mismatch',
    )
    expect(paymentVerifyMessageKey('payment_already_used')).toBe(
      'paymentResult.error.payment_already_used',
    )
    expect(paymentVerifyMessageKey('payment_service_unavailable')).toBe(
      'paymentResult.error.serviceUnavailable',
    )
    expect(paymentVerifyMessageKey('OTHER')).toBeNull()
  })
})

describe('isPaymentVerifyRetriable', () => {
  it('è ritentabile per 503 e payment_service_unavailable', () => {
    expect(isPaymentVerifyRetriable({ status: 503 })).toBe(true)
    expect(isPaymentVerifyRetriable({ code: 'payment_service_unavailable' })).toBe(true)
    expect(isPaymentVerifyRetriable({ retriable: true })).toBe(true)
    expect(isPaymentVerifyRetriable({ code: 'payment_not_found', status: 422 })).toBe(false)
  })
})

describe('isThankYouPaymentSucceeded', () => {
  it('non tratta paid_sync_pending come pagamento completato', () => {
    expect(
      isThankYouPaymentSucceeded({
        paymentStatus: 'pending',
        orderStatus: 'paid_sync_pending',
      }),
    ).toBe(false)
  })

  it('riconosce captured / synced come successo', () => {
    expect(
      isThankYouPaymentSucceeded({
        paymentStatus: 'captured',
        orderStatus: 'paid',
      }),
    ).toBe(true)
    expect(
      isThankYouPaymentSucceeded({
        paymentStatus: 'captured',
        orderStatus: 'synced',
      }),
    ).toBe(true)
  })
})
