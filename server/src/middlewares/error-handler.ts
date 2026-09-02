import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { isAppError } from '../types/errors.js'
import { errorBody } from '../lib/api-response.js'
import { logger } from '../lib/logger.js'
import { env } from '../config/env.js'
import { localeFromRequest, validationUserMessage } from '../lib/validation-user-message.js'

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const correlationId = req.correlationId ?? 'unknown'

  if (err instanceof ZodError) {
    const locale = localeFromRequest({
      headers: req.headers,
      query: req.query,
      body: req.body,
    })
    return res.status(400).json(
      errorBody({
        code: 'VALIDATION_ERROR',
        message: err.message,
        userMessage: validationUserMessage(err, locale),
        retriable: false,
        correlationId,
        details: err.flatten(),
      }),
    )
  }

  if (isAppError(err)) {
    return res.status(err.statusCode).json(
      errorBody({
        code: err.code,
        message: err.message,
        userMessage: err.userMessage,
        retriable: err.retriable,
        correlationId,
        details: err.details,
      }),
    )
  }

  logger.error(
    'Unhandled error',
    {
      err: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    },
    req,
  )

  return res.status(500).json(
    errorBody({
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Internal error' : err instanceof Error ? err.message : 'Internal error',
      userMessage: 'Si è verificato un errore. Riprova più tardi.',
      retriable: true,
      correlationId,
    }),
  )
}
