import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'
import { OdooClientError, toAppError } from '../adapters/odoo/odooClient.js'
import { AppError, isAppError } from '../types/errors.js'
import { errorBody } from '../lib/api-response.js'
import { logger } from '../lib/logger.js'
import { env } from '../config/env.js'
import { localeFromRequest, validationUserMessage } from '../lib/validation-user-message.js'

function toMulterAppError(err: multer.MulterError): AppError {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError(
      'FILE_TOO_LARGE',
      err.message,
      'Il file è troppo grande. Massimo 8 MB (PDF, JPG o PNG).',
      400,
      false,
    )
  }
  return new AppError(
    'INVALID_FILE',
    err.message,
    'Caricamento file non riuscito. Riprova con un PDF, JPG o PNG più piccolo.',
    400,
    false,
  )
}

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

  if (err instanceof multer.MulterError) {
    const multerErr = toMulterAppError(err)
    return res.status(multerErr.statusCode).json(
      errorBody({
        code: multerErr.code,
        message: multerErr.message,
        userMessage: multerErr.userMessage,
        retriable: multerErr.retriable,
        correlationId,
      }),
    )
  }

  const appErr = isAppError(err)
    ? err
    : err instanceof OdooClientError ||
        (err instanceof Error && err.name === 'OdooClientError')
      ? toAppError(err, correlationId)
      : null

  if (appErr) {
    return res.status(appErr.statusCode).json(
      errorBody({
        code: appErr.code,
        message: appErr.message,
        userMessage: appErr.userMessage,
        retriable: appErr.retriable,
        correlationId,
        details: appErr.details,
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
