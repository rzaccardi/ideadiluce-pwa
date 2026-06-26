import type { NextFunction, Request, Response } from 'express'
import type { AdminUser } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { hashSessionToken } from '../lib/token-hash.js'

function adminSessionExpiry(): Date {
  return new Date(Date.now() + env.ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000)
}

/** Carica la sessione backoffice dal cookie `admin_sid` (se valida). */
export function loadAdminSession(req: Request, _res: Response, next: NextFunction) {
  void (async () => {
    const raw = req.cookies?.[env.ADMIN_SESSION_COOKIE_NAME] as string | undefined
    if (!raw) {
      req.adminSessionRecord = null
      req.adminSessionTokenRaw = null
      next()
      return
    }

    const tokenHash = hashSessionToken(raw)
    const row = await prisma.adminSession.findUnique({
      where: { tokenHash },
      include: { adminUser: true },
    })

    if (row && row.expiresAt > new Date() && row.adminUser.status === 'ACTIVE') {
      req.adminSessionRecord = { ...row, adminUser: row.adminUser }
      req.adminSessionTokenRaw = raw
      next()
      return
    }

    req.adminSessionRecord = null
    req.adminSessionTokenRaw = raw
    next()
  })().catch(next)
}

export { adminSessionExpiry }

export type AdminSessionWithUser = {
  id: string
  adminUserId: string
  tokenHash: string
  expiresAt: Date
  adminUser: AdminUser
}
