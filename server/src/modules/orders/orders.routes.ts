import { Router } from 'express'
import { requireLogin } from '../../middlewares/session.js'
import { ordersController } from '../../controllers/orders.controller.js'

export const ordersRouter = Router()

ordersRouter.get('/:id/status', ordersController.status)
ordersRouter.post('/:id/abandon', ordersController.abandon)
ordersRouter.use(requireLogin)
ordersRouter.get('/', ordersController.list)
ordersRouter.get('/:id', ordersController.get)
