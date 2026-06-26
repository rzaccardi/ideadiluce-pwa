import type { Response } from 'express'
import { env } from '../config/env.js'

const MS_DAY = 1000 * 60 * 60 * 24

export function setAdminSessionCookie(res: Response, token: string) {
  res.cookie(env.ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: env.ADMIN_SESSION_DAYS * MS_DAY,
  })
}

export function clearAdminSessionCookie(res: Response) {
  res.clearCookie(env.ADMIN_SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  })
}
