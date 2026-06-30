import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { hashSessionToken, generateSessionToken } from '../lib/token-hash.js'
import { setSessionCookie } from '../lib/cookies.js'
import { AppError } from '../types/errors.js'

const SESSION_LOOKUP_TTL_MS = 5_000
type CachedSession = {
  record: NonNullable<Request['sessionRecord']>
  raw: string
  until: number
}
const sessionLookupCache = new Map<string, CachedSession>()

function readSessionCache(tokenHash: string): CachedSession | null {
  const hit = sessionLookupCache.get(tokenHash)
  if (!hit || hit.until <= Date.now()) {
    if (hit) sessionLookupCache.delete(tokenHash)
    return null
  }
  return hit
}

function writeSessionCache(tokenHash: string, record: NonNullable<Request['sessionRecord']>, raw: string) {
  sessionLookupCache.set(tokenHash, {
    record,
    raw,
    until: Date.now() + SESSION_LOOKUP_TTL_MS,
  })
}

async function loadValidSession(raw: string) {
  const tokenHash = hashSessionToken(raw)
  const cached = readSessionCache(tokenHash)
  if (cached) return cached

  const row = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  })
  if (!row || row.expiresAt <= new Date()) return null

  const record = { ...row, user: row.user }
  writeSessionCache(tokenHash, record, raw)
  return { record, raw }
}

function sessionExpiry(): Date {
  return new Date(Date.now() + env.SESSION_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Carica sessione dal cookie se presente e valida.
 * Non crea sessioni guest — adatto a /api/v2 pubblico (bot, sitemap, SSR anonimo).
 * Con cookie utente loggato (SSR Next) abilita listino B2B/pro nel proxy Arfly.
 */
export function loadSessionIfPresent(req: Request, _res: Response, next: NextFunction) {
  void (async () => {
    const raw = req.cookies?.[env.SESSION_COOKIE_NAME] as string | undefined
    if (!raw) {
      next()
      return
    }
    const loaded = await loadValidSession(raw)
    if (loaded) {
      req.sessionRecord = loaded.record
      req.sessionTokenRaw = loaded.raw
    }
    next()
  })().catch(next)
}

/** Carica sessione dal cookie o ne crea una nuova (guest). */
export function loadOrCreateSession(req: Request, res: Response, next: NextFunction) {
  void (async () => {
    const cookieName = env.SESSION_COOKIE_NAME
    const raw = req.cookies?.[cookieName] as string | undefined

    if (raw) {
      const loaded = await loadValidSession(raw)
      if (loaded) {
        req.sessionRecord = loaded.record
        req.sessionTokenRaw = loaded.raw
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
    const record = { ...created, user: null }
    req.sessionRecord = record
    req.sessionTokenRaw = token
    writeSessionCache(hashSessionToken(token), record, token)
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
