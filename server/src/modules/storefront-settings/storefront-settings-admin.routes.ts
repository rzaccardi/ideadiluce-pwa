import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import {
  getStorefrontSettingsDTO,
  patchStorefrontSettings,
} from './storefront-settings.js'
import { storefrontSettingsPatchSchema } from './storefront-settings.validators.js'

export const storefrontSettingsAdminRouter = Router()

storefrontSettingsAdminRouter.use(loadAdminSession, requireAdminAuth)

storefrontSettingsAdminRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(ok(await getStorefrontSettingsDTO()))
  }),
)

storefrontSettingsAdminRouter.patch(
  '/',
  validateRequest({ body: storefrontSettingsPatchSchema }),
  asyncHandler(async (req, res) => {
    res.json(ok(await patchStorefrontSettings(req.body)))
  }),
)
