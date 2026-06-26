import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { clearSessionCookie, setSessionCookie } from '../lib/cookies.js'
import { authService } from '../modules/auth/auth.service.js'
import { checkoutRegisterService } from '../modules/auth/checkout-register.service.js'
import { passwordResetService } from '../modules/auth/password-reset.service.js'
import { impersonationService } from '../modules/impersonation/impersonation.service.js'
import { asyncHandler } from '../utils/async-handler.js'

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as {
      email: string
      password: string
      firstName?: string
      lastName?: string
      phone?: string
      customerSegment?: 'retail' | 'business'
    }
    const sessionId = req.sessionRecord!.id
    const user = await authService.register(body, sessionId)
    res.status(201).json(ok({ user }))
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { email: string; password: string }
    const sessionId = req.sessionRecord!.id
    const user = await authService.login(body, sessionId, req.correlationId)
    res.json(ok({ user }))
  }),

  checkoutRegister: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as {
      email: string
      password: string
      firstName: string
      lastName: string
      phone?: string
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
    res.json(ok({ user: await authService.me(user), impersonation }))
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
    await passwordResetService.requestReset(email, req.correlationId)
    res.json(ok({ sent: true }))
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body as { token: string; password: string }
    await passwordResetService.resetPassword(token, password, req.correlationId)
    res.json(ok({ reset: true }))
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
        user: user ? await authService.me(user) : null,
        impersonation,
        expiresAt: expiresAt.toISOString(),
      }),
    )
  }),
}
