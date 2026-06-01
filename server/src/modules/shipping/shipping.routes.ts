import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { shippingController } from '../../controllers/shipping.controller.js'
import { quotesSchema, selectSchema } from './shipping.validators.js'

export const shippingRouter = Router()

shippingRouter.post('/quotes', validateRequest({ body: quotesSchema }), shippingController.quotes)
shippingRouter.post('/select', validateRequest({ body: selectSchema }), shippingController.select)
