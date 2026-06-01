import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { hashSessionToken, generateSessionToken } from '../lib/token-hash.js'
import { setSessionCookie } from '../lib/cookies.js'
import { AppError } from '../types/errors.js'

function sessionExpiry(): Date {
  return new Date(Date.now() + env.SESSION_DAYS * 24 * 60 * 60 * 1000)
}

/** Carica sessione dal cookie o ne crea una nuova (guest). */
export function loadOrCreateSession(req: Request, res: Response, next: NextFunction) {
  void (async () => {
    const cookieName = env.SESSION_COOKIE_NAME
    const raw = req.cookies?.[cookieName] as string | undefined

    if (raw) {
      const tokenHash = hashSessionToken(raw)
      const row = await prisma.session.findUnique({
        where: { tokenHash },
        include: { user: true },
      })
      if (row && row.expiresAt > new Date()) {
        req.sessionRecord = { ...row, user: row.user }
        req.sessionTokenRaw = raw
        next()
        return
      }
    }

    const token = generateSessionToken()
    const created = await prisma.session.create({
      data: {
        tokenHash: hashSessionToken(token),
        expiresAt: sessionExpiry(),
      },
      include: { user: true },
    })
    setSessionCookie(res, token)
    req.sessionRecord = { ...created, user: null }
    req.sessionTokenRaw = token
    next()
  })().catch(next)
}

export function requireLogin(req: Request, _res: Response, next: NextFunction) {
  const user = req.sessionRecord?.user
  if (!user) {
    return next(
      new AppError(
        'UNAUTHORIZED',
        'Authentication required',
        'Effettua il login per continuare.',
        401,
        false,
      ),
    )
  }
  next()
}
