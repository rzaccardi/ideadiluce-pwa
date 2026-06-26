import type { Request, Response } from 'express'
import { ok } from '../../lib/api-response.js'
import { clearAdminSessionCookie, setAdminSessionCookie } from '../../lib/admin-cookies.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { adminAuthService } from './admin-auth.service.js'

export const adminAuthController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { email: string; password: string }
    const { user, workspace, token } = await adminAuthService.login(body)
    setAdminSessionCookie(res, token)
    res.json(ok({ user, workspace }))
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await adminAuthService.logout(req.adminSessionTokenRaw)
    clearAdminSessionCookie(res)
    res.json(ok({ loggedOut: true }))
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = req.adminSessionRecord!.adminUser
    res.json(
      ok({
        user: adminAuthService.me(user),
        workspace: adminAuthService.workspaceConfig(),
      }),
    )
  }),
}
