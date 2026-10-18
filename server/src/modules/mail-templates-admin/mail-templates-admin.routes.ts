import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { listMailTemplatePreviews } from './mail-templates-admin.service.js'

export const mailTemplatesAdminRouter = Router()

mailTemplatesAdminRouter.use(loadAdminSession, requireAdminAuth)

mailTemplatesAdminRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = listMailTemplatePreviews()
    res.json(ok({ items }))
  }),
)
