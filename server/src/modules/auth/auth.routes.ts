import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { requireLogin } from '../../middlewares/session.js'
import {
  checkoutLoginBodySchema,
  checkoutRegisterBodySchema,
  checkoutForgotPasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
} from './auth.validators.js'
import { impersonationExchangeBodySchema } from '../impersonation/impersonation.validators.js'
import { authController } from '../../controllers/auth.controller.js'
import { authSensitiveRateLimit } from '../../lib/rate-limiters.js'

export const authRouter = Router()

authRouter.post(
  '/register',
  authSensitiveRateLimit,
  validateRequest({ body: registerBodySchema }),
  authController.register,
)
authRouter.post(
  '/login',
  authSensitiveRateLimit,
  validateRequest({ body: loginBodySchema }),
  authController.login,
)
authRouter.post(
  '/checkout-login',
  authSensitiveRateLimit,
  validateRequest({ body: checkoutLoginBodySchema }),
  authController.login,
)
authRouter.post(
  '/checkout-register',
  authSensitiveRateLimit,
  validateRequest({ body: checkoutRegisterBodySchema }),
  authController.checkoutRegister,
)
authRouter.post('/logout', authController.logout)
authRouter.post('/refresh', authController.refresh)
authRouter.get('/me', requireLogin, authController.me)
authRouter.post(
  '/checkout-forgot-password',
  authSensitiveRateLimit,
  validateRequest({ body: checkoutForgotPasswordBodySchema }),
  authController.forgotPassword,
)
authRouter.post(
  '/forgot-password',
  authSensitiveRateLimit,
  validateRequest({ body: forgotPasswordBodySchema }),
  authController.forgotPassword,
)
authRouter.post(
  '/reset-password',
  authSensitiveRateLimit,
  validateRequest({ body: resetPasswordBodySchema }),
  authController.resetPassword,
)
authRouter.post(
  '/impersonate/exchange',
  authSensitiveRateLimit,
  validateRequest({ body: impersonationExchangeBodySchema }),
  authController.impersonateExchange,
)
authRouter.post('/impersonate/end', requireLogin, authController.impersonateEnd)
