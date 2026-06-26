import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { paymentsController } from '../../controllers/payments.controller.js'
import {
  confirmPaymentSchema,
  createPaymentSessionSchema,
  prepareWalletCheckoutSchema,
} from './payments.validators.js'

export const paymentsRouter = Router()

paymentsRouter.get('/stripe/config', paymentsController.stripeConfig)
paymentsRouter.post(
  '/create-session',
  validateRequest({ body: createPaymentSessionSchema }),
  paymentsController.createSession,
)
paymentsRouter.post(
  '/prepare-wallet-checkout',
  validateRequest({ body: prepareWalletCheckoutSchema }),
  paymentsController.prepareWalletCheckout,
)
paymentsRouter.post(
  '/confirm',
  validateRequest({ body: confirmPaymentSchema }),
  paymentsController.confirm,
)
paymentsRouter.get('/stripe/return', paymentsController.stripeReturn)
paymentsRouter.post('/webhook/nexi', paymentsController.nexiWebhook)
paymentsRouter.post('/webhook/paypal', paymentsController.paypalWebhook)

