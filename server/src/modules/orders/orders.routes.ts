import { Router } from 'express'
import { requireLogin } from '../../middlewares/session.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { ordersController } from '../../controllers/orders.controller.js'
import { orderReturnRequestBodySchema } from './order-return-request.validators.js'

export const ordersRouter = Router()

ordersRouter.get('/:id/status', ordersController.status)
ordersRouter.get('/:id/thank-you', ordersController.thankYou)
ordersRouter.post('/:id/abandon', ordersController.abandon)
ordersRouter.use(requireLogin)
ordersRouter.get('/invoices', ordersController.listInvoices)
ordersRouter.get('/', ordersController.list)
ordersRouter.get('/:id/recommendations', ordersController.recommendations)
ordersRouter.post('/:id/reorder', ordersController.reorder)
ordersRouter.post(
  '/:id/return-request',
  validateRequest({ body: orderReturnRequestBodySchema }),
  ordersController.requestReturn,
)
ordersRouter.get('/:id', ordersController.get)
