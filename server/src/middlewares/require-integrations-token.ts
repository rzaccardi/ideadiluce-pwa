import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { AppError } from '../types/errors.js'

/** Richiede `X-Integrations-Token` uguale a `INTEGRATIONS_TOKEN` (server-to-server). */
export function requireIntegrationsToken(req: Request, _res: Response, next: NextFunction) {
  const token = env.INTEGRATIONS_TOKEN?.trim()
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
  if (req.get('x-integrations-token') !== token) {
    return next(new AppError('FORBIDDEN', 'Bad integration token', 'Accesso negato.', 403, false))
  }
  next()
}
