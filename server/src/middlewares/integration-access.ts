import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { AppError } from '../types/errors.js'

/**
 * Endpoint integrazione (CI / tool interni):
 * - in produzione richiede sempre `INTEGRATIONS_TOKEN`;
 * - in sviluppo, se il token manca, richiede un utente loggato (non sessione guest).
 */
export function requireIntegrationAccess(req: Request, _res: Response, next: NextFunction) {
  const token = env.INTEGRATIONS_TOKEN?.trim()
  if (env.NODE_ENV === 'production' || token) {
    if (!token) {
      return next(
        new AppError(
          'MISCONFIGURED',
          'INTEGRATIONS_TOKEN missing',
          'Integrazione non configurata sul server.',
          503,
          false,
        ),
      )
    }
    const got = req.get('x-integrations-token')
    if (got !== token) {
      return next(
        new AppError('FORBIDDEN', 'Bad integration token', 'Accesso negato.', 403, false),
      )
    }
    return next()
  }

  if (!req.sessionRecord?.user) {
    return next(
      new AppError('UNAUTHORIZED', 'Authentication required', 'Effettua il login per continuare.', 401, false),
    )
  }
  next()
}
