import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { createCheckoutSessionSchema } from './checkout.validators.js'
import { checkoutStartSchema } from '../payments/payments.validators.js'
import { checkoutDraftSchema } from './checkout-draft.validators.js'
import { checkoutController } from '../../controllers/checkout.controller.js'

export const checkoutRouter = Router()

checkoutRouter.post('/start', validateRequest({ body: checkoutStartSchema }), checkoutController.start)
checkoutRouter.patch('/draft', validateRequest({ body: checkoutDraftSchema }), checkoutController.patchDraft)
checkoutRouter.post('/session', validateRequest({ body: createCheckoutSessionSchema }), checkoutController.createSession)
checkoutRouter.get('/session/:id', checkoutController.getSession)
checkoutRouter.post('/session/:id/redirect', checkoutController.redirect)
checkoutRouter.post('/session/:id/payment-url', checkoutController.paymentUrl)
