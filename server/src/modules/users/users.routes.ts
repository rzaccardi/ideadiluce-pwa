import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { requireLogin } from '../../middlewares/session.js'
import { patchMeSchema } from './users.validators.js'
import { usersController } from '../../controllers/users.controller.js'

export const usersRouter = Router()

usersRouter.use(requireLogin)
usersRouter.patch('/me', validateRequest({ body: patchMeSchema }), usersController.patchMe)
