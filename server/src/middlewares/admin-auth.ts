import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../types/errors.js'

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction) {
  const adminUser = req.adminSessionRecord?.adminUser
  if (!adminUser) {
    next(new AppError('ADMIN_UNAUTHORIZED', 'Unauthorized', 'Accesso backoffice richiesto.', 401, false))
    return
  }
  next()
}
