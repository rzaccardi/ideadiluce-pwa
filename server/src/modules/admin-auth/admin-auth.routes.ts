import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { adminAuthController } from './admin-auth.controller.js'
import { adminLoginBodySchema } from './admin-auth.validators.js'
import { adminLoginRateLimit } from '../../lib/rate-limiters.js'

export const adminAuthRouter = Router()

adminAuthRouter.use(loadAdminSession)

adminAuthRouter.post(
  '/login',
  adminLoginRateLimit,
  validateRequest({ body: adminLoginBodySchema }),
  adminAuthController.login,
)

adminAuthRouter.post('/logout', adminAuthController.logout)

adminAuthRouter.get('/me', requireAdminAuth, adminAuthController.me)
