import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { requireLogin } from '../../middlewares/session.js'
import { patchBusinessSchema } from '../checkout/checkout.validators.js'
import { patchMeSchema } from './users.validators.js'
import { usersController } from '../../controllers/users.controller.js'

export const usersRouter = Router()

usersRouter.use(requireLogin)
usersRouter.get('/me/professional-request', usersController.myProfessionalRequest)
usersRouter.patch('/me', validateRequest({ body: patchMeSchema }), usersController.patchMe)
usersRouter.patch(
  '/me/business',
  validateRequest({ body: patchBusinessSchema }),
  usersController.patchBusiness,
)
