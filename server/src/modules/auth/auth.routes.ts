import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { requireLogin } from '../../middlewares/session.js'
import { loginBodySchema, registerBodySchema } from './auth.validators.js'
import { authController } from '../../controllers/auth.controller.js'

export const authRouter = Router()

authRouter.post('/register', validateRequest({ body: registerBodySchema }), authController.register)
authRouter.post('/login', validateRequest({ body: loginBodySchema }), authController.login)
authRouter.post('/logout', authController.logout)
authRouter.get('/me', requireLogin, authController.me)
