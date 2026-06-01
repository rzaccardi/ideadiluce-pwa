import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { AppError } from '../types/errors.js'

/**
 * Protezione endpoint integrazione:
 * - con `INTEGRATIONS_TOKEN`: richiede header `X-Integrations-Token` (CI / tool);
 * - senza token: basta **cookie di sessione** (guest o autenticato), per consentire test checkout dal browser.
 */
export function requireIntegrationAccess(req: Request, _res: Response, next: NextFunction) {
  const token = env.INTEGRATIONS_TOKEN?.trim()
  if (token) {
    const got = req.get('x-integrations-token')
    if (got !== token) {
      return next(
        new AppError('FORBIDDEN', 'Bad integration token', 'Accesso negato.', 403, false),
      )
    }
    return next()
  }
  if (!req.sessionRecord) {
    return next(
      new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile. Ricarica la pagina.', 500, false),
    )
  }
  next()
}
