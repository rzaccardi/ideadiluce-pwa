import { publicAppUrl } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { AppError } from '../../types/errors.js'
import {
  isOdooApiV2Configured,
  OdooApiV2Error,
  toOdooApiV2AppError,
} from '../../adapters/odoo-api/odooApiClient.js'
import {
  odooApiPasswordReset,
  odooApiPasswordResetConfirm,
} from '../../adapters/odoo-api/odooApi.resources.js'
import { LOCALE_PATH, type HubLocale } from '../../lib/hub-locale.js'

function resetReturnUrl(locale: HubLocale = 'IT'): string {
  const prefix = LOCALE_PATH[locale] ?? ''
  return publicAppUrl(`${prefix}/reset-password`)
}

function fieldFromOdooBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const field = (body as { field?: unknown }).field
  return typeof field === 'string' && field.trim() ? field.trim() : undefined
}

function mapConfirmError(e: OdooApiV2Error, correlationId: string): AppError {
  const field = fieldFromOdooBody(e.body)
  if (e.httpStatus === 400 && field === 'token') {
    return new AppError(
      'INVALID_RESET_TOKEN',
      e.message || 'Invalid token',
      'Token non valido o scaduto',
      400,
      false,
      { correlationId, body: e.body },
    )
  }
  if (e.httpStatus === 400 && field === 'password') {
    return new AppError(
      'VALIDATION_ERROR',
      e.message || 'Invalid password',
      'La password deve avere almeno 8 caratteri',
      400,
      false,
      { correlationId, body: e.body },
    )
  }
  return toOdooApiV2AppError(e, correlationId)
}

export const passwordResetService = {
  /**
   * Delega a Odoo `POST /api/v2/auth/password-reset`: token + mail del sito.
   * Risposta utente sempre “sent” (Odoo risponde 202 anche se l’email non esiste).
   */
  async requestReset(
    email: string,
    correlationId?: string,
    locale: HubLocale = 'IT',
  ): Promise<void> {
    const normalized = email.toLowerCase().trim()
    const corr = correlationId ?? 'password-reset'

    if (!isOdooApiV2Configured()) {
      throw new AppError(
        'ODOO_API_UNAVAILABLE',
        'Odoo API v2 not configured',
        'Servizio temporaneamente non disponibile. Riprova tra poco.',
        503,
        true,
        { correlationId: corr },
      )
    }

    const returnUrl = resetReturnUrl(locale)
    try {
      await odooApiPasswordReset(
        { email: normalized, return_url: returnUrl },
        corr,
      )
      logger.info('password_reset.odoo_accepted', {
        correlationId: corr,
        email: normalized,
        returnUrl,
      })
    } catch (e) {
      if (e instanceof OdooApiV2Error) {
        logger.error('password_reset.odoo_request_failed', {
          correlationId: corr,
          email: normalized,
          status: e.httpStatus,
          error: e.message,
        })
        throw toOdooApiV2AppError(e, corr)
      }
      throw e
    }
  },

  /**
   * Inoltra a Odoo `POST /api/v2/auth/password-reset/confirm`.
   * Nessun token locale (`PasswordResetToken`) né sync XML-RPC.
   */
  async resetPassword(
    token: string,
    password: string,
    correlationId?: string,
  ): Promise<{ email: string; customerId: number }> {
    const corr = correlationId ?? 'password-reset'
    const rawToken = token.trim()

    if (!rawToken) {
      throw new AppError(
        'INVALID_RESET_TOKEN',
        'Invalid token',
        'Token non valido o scaduto',
        400,
        false,
      )
    }

    if (!isOdooApiV2Configured()) {
      throw new AppError(
        'ODOO_API_UNAVAILABLE',
        'Odoo API v2 not configured',
        'Servizio temporaneamente non disponibile. Riprova tra poco.',
        503,
        true,
        { correlationId: corr },
      )
    }

    try {
      const result = await odooApiPasswordResetConfirm(
        { token: rawToken, password },
        corr,
      )
      logger.info('password_reset.odoo_confirmed', {
        correlationId: corr,
        customerId: result.customer_id,
        email: result.email,
        userCreated: result.user_created ?? false,
      })
      return { email: result.email, customerId: result.customer_id }
    } catch (e) {
      if (e instanceof OdooApiV2Error) throw mapConfirmError(e, corr)
      throw e
    }
  },
}
