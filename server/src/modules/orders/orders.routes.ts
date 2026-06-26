import { Router } from 'express'
import { requireLogin } from '../../middlewares/session.js'
import { ordersController } from '../../controllers/orders.controller.js'

export const ordersRouter = Router()

ordersRouter.get('/:id/status', ordersController.status)
ordersRouter.get('/:id/thank-you', ordersController.thankYou)
ordersRouter.post('/:id/abandon', ordersController.abandon)
ordersRouter.use(requireLogin)
ordersRouter.get('/invoices', ordersController.listInvoices)
ordersRouter.get('/', ordersController.list)
ordersRouter.get('/:id/recommendations', ordersController.recommendations)
ordersRouter.post('/:id/reorder', ordersController.reorder)
ordersRouter.get('/:id', ordersController.get)
