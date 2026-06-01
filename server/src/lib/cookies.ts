import type { Response } from 'express'
import { env } from '../config/env.js'

const MS_DAY = 1000 * 60 * 60 * 24

export function setSessionCookie(res: Response, token: string) {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: env.SESSION_DAYS * MS_DAY,
  })
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  })
}
