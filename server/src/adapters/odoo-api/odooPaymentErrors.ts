import { AppError } from '../../types/errors.js'
import { OdooApiV2Error } from './odooApiClient.js'

/** Codici stabili restituiti da `POST /api/v2/orders/<id>/payments` (verifica provider). */
export const ODOO_PAYMENT_VERIFY_CODES = [
  'payment_not_found',
  'payment_not_succeeded',
  'payment_env_mismatch',
  'payment_currency_mismatch',
  'payment_already_used',
  'payment_service_unavailable',
] as const

export type OdooPaymentVerifyCode = (typeof ODOO_PAYMENT_VERIFY_CODES)[number]

const VERIFY_CODE_SET = new Set<string>(ODOO_PAYMENT_VERIFY_CODES)

const USER_MESSAGES: Record<OdooPaymentVerifyCode, string> = {
  payment_not_found:
    'Non abbiamo trovato il pagamento presso il gestore. Se l’importo è stato addebitato, contatta l’assistenza.',
  payment_not_succeeded:
    'Il pagamento non risulta completato. Riprova oppure scegli un altro metodo di pagamento.',
  payment_env_mismatch:
    'Il pagamento non è allineato con l’ambiente previsto. Contatta l’assistenza.',
  payment_currency_mismatch:
    'La valuta del pagamento non corrisponde a quella dell’ordine. Contatta l’assistenza.',
  payment_already_used:
    'Questo pagamento risulta già utilizzato per un altro ordine. Contatta l’assistenza.',
  payment_service_unavailable:
    'Verifica del pagamento temporaneamente non disponibile. Riprova tra poco.',
}

export function errorCodeFromOdooBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const rec = body as Record<string, unknown>
  for (const key of ['code', 'error_code', 'error'] as const) {
    const value = rec[key]
    if (typeof value === 'string' && value.trim()) {
      const normalized = value.trim()
      if (VERIFY_CODE_SET.has(normalized) || /^[a-z][a-z0-9_]*$/.test(normalized)) {
        return normalized
      }
    }
  }
  return null
}

export function isOdooPaymentVerifyCode(code: string): code is OdooPaymentVerifyCode {
  return VERIFY_CODE_SET.has(code)
}

/**
 * Mappa errori di verifica pagamento Odoo API → AppError con `code` stabile.
 * Restituisce null se non è un caso di verifica pagamento gestito esplicitamente.
 */
export function toOdooPaymentVerifyAppError(
  e: OdooApiV2Error,
  correlationId: string,
): AppError | null {
  const fromBody = errorCodeFromOdooBody(e.body)
  const trimmedMessage = typeof e.message === 'string' ? e.message.trim() : ''
  const fromMessage = isOdooPaymentVerifyCode(trimmedMessage) ? trimmedMessage : null

  let code: OdooPaymentVerifyCode | null = null
  if (fromBody && isOdooPaymentVerifyCode(fromBody)) code = fromBody
  else if (fromMessage) code = fromMessage
  else if (e.httpStatus === 503) code = 'payment_service_unavailable'

  if (!code) return null

  const status =
    code === 'payment_already_used' ? 409 : code === 'payment_service_unavailable' ? 503 : 422
  const retriable = code === 'payment_service_unavailable'

  return new AppError(code, e.message || code, USER_MESSAGES[code], status, retriable, {
    correlationId,
    body: e.body,
    odooHttpStatus: e.httpStatus,
  })
}

export function paymentVerifyUserMessage(code: OdooPaymentVerifyCode): string {
  return USER_MESSAGES[code]
}
