import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { AppError } from '../types/errors.js'

export function requireAdminToken(req: Request, _res: Response, next: NextFunction) {
  const token = env.ADMIN_API_TOKEN?.trim()
  if (!token) {
    next(new AppError('ADMIN_NOT_CONFIGURED', 'Admin token missing', 'Admin API non configurata.', 503, false))
    return
  }
  const header = req.headers['x-admin-token']
  if (header !== token) {
    next(new AppError('ADMIN_UNAUTHORIZED', 'Unauthorized', 'Token admin non valido.', 401, false))
    return
  }
  next()
}
