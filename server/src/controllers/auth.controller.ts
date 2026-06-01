import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { clearSessionCookie, setSessionCookie } from '../lib/cookies.js'
import { authService } from '../modules/auth/auth.service.js'
import { asyncHandler } from '../utils/async-handler.js'

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as {
      email: string
      password: string
      firstName?: string
      lastName?: string
      phone?: string
    }
    const sessionId = req.sessionRecord!.id
    const user = await authService.register(body, sessionId)
    res.status(201).json(ok({ user }))
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { email: string; password: string }
    const sessionId = req.sessionRecord!.id
    const user = await authService.login(body, sessionId)
    res.json(ok({ user }))
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.sessionTokenRaw)
    clearSessionCookie(res)
    const { token } = await authService.issueNewGuestSession()
    setSessionCookie(res, token)
    res.json(ok({ loggedOut: true }))
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = req.sessionRecord!.user!
    res.json(ok({ user: authService.me(user) }))
  }),
}
