import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { clearSessionCookie, setSessionCookie } from '../lib/cookies.js'
import { localeFromRequest } from '../lib/validation-user-message.js'
import { authService } from '../modules/auth/auth.service.js'
import { checkEmailService } from '../modules/auth/check-email.service.js'
import { checkoutRegisterService } from '../modules/auth/checkout-register.service.js'
import { passwordResetService } from '../modules/auth/password-reset.service.js'
import { impersonationService } from '../modules/impersonation/impersonation.service.js'
import { asyncHandler } from '../utils/async-handler.js'
import { logger } from '../lib/logger.js'

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as {
      email: string
      password: string
      firstName?: string
      lastName?: string
      phone?: string
      customerSegment?: 'retail' | 'business'
      companyName?: string
      vatNumber?: string
      fiscalCode?: string
    }
    const sessionId = req.sessionRecord!.id
    const user = await authService.register(body, sessionId, req.correlationId)
    res.status(201).json(ok({ user }))
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { email: string; password: string }
    const sessionId = req.sessionRecord!.id
    const user = await authService.login(body, sessionId, req.correlationId)
    res.json(ok({ user }))
  }),

  /** Login da checkout: adotta il carrello guest corrente, senza merge di carrelli abbandonati. */
  checkoutLogin: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { email: string; password: string }
    const sessionId = req.sessionRecord!.id
    const user = await authService.login(body, sessionId, req.correlationId, {
      cartMode: 'adopt_session',
    })
    res.json(ok({ user }))
  }),

  checkEmail: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string }
    const result = await checkEmailService.checkEmail(email, req.correlationId)
    res.json(ok(result))
  }),

  checkoutRegister: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as {
      email: string
      password: string
      firstName: string
      lastName: string
      phone?: string
      customerSegment?: 'retail' | 'business'
      companyName?: string
      vatNumber?: string
      fiscalCode?: string
    }
    const sessionId = req.sessionRecord!.id
    const user = await checkoutRegisterService.register(body, sessionId, req.correlationId)
    res.status(201).json(ok({ user }))
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { token } = await authService.logout(req.sessionRecord?.id, req.sessionTokenRaw)
    clearSessionCookie(res)
    setSessionCookie(res, token)
    res.json(ok({ loggedOut: true }))
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = req.sessionRecord!.user!
    const impersonation = await impersonationService.getImpersonationForSession(req.sessionRecord!.id)
    res.json(ok({ user: await authService.me(user, { correlationId: req.correlationId }), impersonation }))
  }),

  impersonateExchange: asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body as { token: string }
    const result = await impersonationService.exchangeToken(
      token,
      req.sessionRecord?.id,
      req.sessionTokenRaw,
      req.correlationId,
    )
    setSessionCookie(res, result.token)
    res.json(ok({ user: result.user, impersonation: result.impersonation }))
  }),

  impersonateEnd: asyncHandler(async (req: Request, res: Response) => {
    const { guestToken } = await impersonationService.endImpersonation(
      req.sessionRecord!.id,
      req.sessionTokenRaw,
      req.correlationId,
    )
    clearSessionCookie(res)
    setSessionCookie(res, guestToken)
    res.json(ok({ ended: true }))
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string }
    const locale = localeFromRequest(req)
    await passwordResetService.requestReset(email, req.correlationId, locale)
    res.json(ok({ sent: true }))
  }),

  /** Conferma token Odoo via API v2, poi login PWA con la nuova password. */
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body as { token: string; password: string }
    const confirmed = await passwordResetService.resetPassword(
      token,
      password,
      req.correlationId,
    )
    const sessionId = req.sessionRecord!.id
    try {
      const user = await authService.login(
        { email: confirmed.email, password },
        sessionId,
        req.correlationId,
      )
      res.json(ok({ reset: true, user, email: confirmed.email }))
    } catch (e) {
      logger.warn('password_reset.login_after_confirm_failed', {
        correlationId: req.correlationId,
        email: confirmed.email,
        error: e instanceof Error ? e.message : String(e),
      })
      res.json(ok({ reset: true, user: null, email: confirmed.email }))
    }
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const session = req.sessionRecord!
    const { token, expiresAt } = await authService.refreshSession(session.id)
    setSessionCookie(res, token)

    const user = session.user
    const impersonation = user
      ? await impersonationService.getImpersonationForSession(session.id)
      : null

    res.json(
      ok({
        user: user ? await authService.me(user, { correlationId: req.correlationId }) : null,
        impersonation,
        expiresAt: expiresAt.toISOString(),
      }),
    )
  }),
}
