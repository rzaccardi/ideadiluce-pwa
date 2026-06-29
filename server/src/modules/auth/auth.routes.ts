import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { requireRecaptcha } from '../../middlewares/require-recaptcha.js'
import { requireLogin } from '../../middlewares/session.js'
import {
  checkoutRegisterBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
} from './auth.validators.js'
import { impersonationExchangeBodySchema } from '../impersonation/impersonation.validators.js'
import { authController } from '../../controllers/auth.controller.js'

export const authRouter = Router()

authRouter.post(
  '/register',
  validateRequest({ body: registerBodySchema }),
  requireRecaptcha('register'),
  authController.register,
)
authRouter.post(
  '/login',
  validateRequest({ body: loginBodySchema }),
  requireRecaptcha('login'),
  authController.login,
)
authRouter.post(
  '/checkout-register',
  validateRequest({ body: checkoutRegisterBodySchema }),
  requireRecaptcha('register'),
  authController.checkoutRegister,
)
authRouter.post('/logout', authController.logout)
authRouter.post('/refresh', authController.refresh)
authRouter.get('/me', requireLogin, authController.me)
authRouter.post(
  '/forgot-password',
  validateRequest({ body: forgotPasswordBodySchema }),
  authController.forgotPassword,
)
authRouter.post(
  '/reset-password',
  validateRequest({ body: resetPasswordBodySchema }),
  authController.resetPassword,
)
authRouter.post(
  '/impersonate/exchange',
  validateRequest({ body: impersonationExchangeBodySchema }),
  authController.impersonateExchange,
)
authRouter.post('/impersonate/end', requireLogin, authController.impersonateEnd)
