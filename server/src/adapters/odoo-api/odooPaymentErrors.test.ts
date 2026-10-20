import { describe, expect, it } from 'vitest'
import { OdooApiV2Error } from './odooApiClient.js'
import {
  errorCodeFromOdooBody,
  toOdooPaymentVerifyAppError,
} from './odooPaymentErrors.js'

describe('errorCodeFromOdooBody', () => {
  it('legge code / error_code / error snake_case', () => {
    expect(errorCodeFromOdooBody({ code: 'payment_not_found' })).toBe('payment_not_found')
    expect(errorCodeFromOdooBody({ error_code: 'payment_already_used' })).toBe(
      'payment_already_used',
    )
    expect(errorCodeFromOdooBody({ error: 'payment_env_mismatch' })).toBe('payment_env_mismatch')
    expect(errorCodeFromOdooBody({ error: 'Messaggio libero' })).toBeNull()
  })
})

describe('toOdooPaymentVerifyAppError', () => {
  it('mappa 422 payment_not_found', () => {
    const err = toOdooPaymentVerifyAppError(
      new OdooApiV2Error('not found', 422, { code: 'payment_not_found' }),
      'c1',
    )
    expect(err?.code).toBe('payment_not_found')
    expect(err?.statusCode).toBe(422)
    expect(err?.retriable).toBe(false)
    expect(err?.userMessage).toMatch(/Non abbiamo trovato il pagamento/i)
  })

  it('mappa payment_not_succeeded, payment_env_mismatch, payment_currency_mismatch', () => {
    for (const code of [
      'payment_not_succeeded',
      'payment_env_mismatch',
      'payment_currency_mismatch',
    ] as const) {
      const err = toOdooPaymentVerifyAppError(
        new OdooApiV2Error(code, 422, { error: code }),
        'c1',
      )
      expect(err?.code).toBe(code)
      expect(err?.statusCode).toBe(422)
      expect(err?.retriable).toBe(false)
    }
  })

  it('mappa 409 payment_already_used', () => {
    const err = toOdooPaymentVerifyAppError(
      new OdooApiV2Error('used', 409, { code: 'payment_already_used' }),
      'c1',
    )
    expect(err?.code).toBe('payment_already_used')
    expect(err?.statusCode).toBe(409)
    expect(err?.retriable).toBe(false)
  })

  it('mappa 503 come payment_service_unavailable ritentabile', () => {
    const err = toOdooPaymentVerifyAppError(
      new OdooApiV2Error('down', 503, null),
      'c1',
    )
    expect(err?.code).toBe('payment_service_unavailable')
    expect(err?.statusCode).toBe(503)
    expect(err?.retriable).toBe(true)
  })

  it('ignora 409 di riconciliazione importo senza code verify', () => {
    const err = toOdooPaymentVerifyAppError(
      new OdooApiV2Error('amount mismatch', 409, { reconciliation: { diff_cents: 1 } }),
      'c1',
    )
    expect(err).toBeNull()
  })
})
