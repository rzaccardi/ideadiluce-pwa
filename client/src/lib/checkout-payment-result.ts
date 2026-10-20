import type { MessageKey } from '@/i18n/messages'

/** Stripe return va chiamato solo per pagamenti carta, non per il bonifico. */
export function shouldFinalizeStripeOnThankYou(input: {
  hasStripeReturnParams: boolean
  paymentMethod: string | null
}): boolean {
  if (input.hasStripeReturnParams) return true
  return input.paymentMethod === 'stripe'
}

/** Codici AppError di verifica pagamento Odoo/API (allineati al server). */
export const PAYMENT_VERIFY_ERROR_CODES = [
  'payment_not_found',
  'payment_not_succeeded',
  'payment_env_mismatch',
  'payment_currency_mismatch',
  'payment_already_used',
  'payment_service_unavailable',
] as const

export type PaymentVerifyErrorCode = (typeof PAYMENT_VERIFY_ERROR_CODES)[number]

const CODE_TO_MESSAGE_KEY: Record<PaymentVerifyErrorCode, MessageKey> = {
  payment_not_found: 'paymentResult.error.payment_not_found',
  payment_not_succeeded: 'paymentResult.error.payment_not_succeeded',
  payment_env_mismatch: 'paymentResult.error.payment_env_mismatch',
  payment_currency_mismatch: 'paymentResult.error.payment_currency_mismatch',
  payment_already_used: 'paymentResult.error.payment_already_used',
  payment_service_unavailable: 'paymentResult.error.serviceUnavailable',
}

export function isPaymentVerifyErrorCode(code: string): code is PaymentVerifyErrorCode {
  return (PAYMENT_VERIFY_ERROR_CODES as readonly string[]).includes(code)
}

export function paymentVerifyMessageKey(code: string): MessageKey | null {
  if (!isPaymentVerifyErrorCode(code)) return null
  return CODE_TO_MESSAGE_KEY[code]
}

/** 503 / payment_service_unavailable → mostra ritento verifica. */
export function isPaymentVerifyRetriable(input: {
  code?: string | null
  status?: number | null
  retriable?: boolean | null
}): boolean {
  if (input.retriable) return true
  if (input.status === 503) return true
  return input.code === 'payment_service_unavailable'
}

/**
 * True solo se ordine/pagamento risultano davvero completati lato PWA
 * (esclude paid_sync_pending: sync Odoo non confermata).
 */
export function isThankYouPaymentSucceeded(input: {
  paymentStatus: string | null | undefined
  orderStatus: string | null | undefined
}): boolean {
  const paymentOk =
    input.paymentStatus === 'captured' || input.paymentStatus === 'authorized'
  const orderOk =
    input.orderStatus === 'paid' ||
    input.orderStatus === 'confirmed' ||
    input.orderStatus === 'completed' ||
    input.orderStatus === 'synced'
  return paymentOk || orderOk
}
