import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'

function createLimiter(options: {
  maxProduction: number
  maxDev: number
  windowMs?: number
  code: string
  message: string
}) {
  return rateLimit({
    windowMs: options.windowMs ?? 60_000,
    max: env.NODE_ENV === 'production' ? options.maxProduction : options.maxDev,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: options.code,
        message: options.message,
        userMessage: options.message,
        retriable: true,
      },
    },
  })
}

/** Login, registrazione, reset password, impersonation. */
export const authSensitiveRateLimit = createLimiter({
  maxProduction: 10,
  maxDev: 80,
  code: 'AUTH_RATE_LIMIT',
  message: 'Troppi tentativi. Riprova tra un minuto.',
})

export const adminLoginRateLimit = createLimiter({
  maxProduction: 8,
  maxDev: 40,
  code: 'ADMIN_AUTH_RATE_LIMIT',
  message: 'Troppi tentativi di accesso backoffice.',
})

/** Form pubblici con upload o invio email. */
export const formSubmitRateLimit = createLimiter({
  maxProduction: 6,
  maxDev: 40,
  code: 'FORM_RATE_LIMIT',
  message: 'Troppe richieste. Riprova tra poco.',
})

export const addressSearchRateLimit = createLimiter({
  maxProduction: 40,
  maxDev: 200,
  code: 'ADDRESS_RATE_LIMIT',
  message: 'Troppe ricerche indirizzo.',
})

export const shippingQuotesRateLimit = createLimiter({
  maxProduction: 20,
  maxDev: 100,
  code: 'SHIPPING_RATE_LIMIT',
  message: 'Troppe richieste di spedizione.',
})

export const vatValidatePublicRateLimit = createLimiter({
  maxProduction: 10,
  maxDev: 40,
  code: 'VAT_RATE_LIMIT',
  message: 'Troppe validazioni partita IVA.',
})
