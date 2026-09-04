import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { requireLogin } from '../../middlewares/session.js'
import { patchBusinessSchema } from '../checkout/checkout.validators.js'
import { patchMeSchema } from './users.validators.js'
import {
  shippingAddressIdParamSchema,
  upsertShippingAddressSchema,
} from './user-shipping-addresses.validators.js'
import { usersController } from '../../controllers/users.controller.js'

export const usersRouter = Router()

usersRouter.use(requireLogin)
usersRouter.get('/me/professional-request', usersController.myProfessionalRequest)
usersRouter.get('/me/shipping-addresses', usersController.listShippingAddresses)
usersRouter.post(
  '/me/shipping-addresses',
  validateRequest({ body: upsertShippingAddressSchema }),
  usersController.createShippingAddress,
)
usersRouter.patch(
  '/me/shipping-addresses/:id',
  validateRequest({ params: shippingAddressIdParamSchema, body: upsertShippingAddressSchema }),
  usersController.updateShippingAddress,
)
usersRouter.delete(
  '/me/shipping-addresses/:id',
  validateRequest({ params: shippingAddressIdParamSchema }),
  usersController.deleteShippingAddress,
)
usersRouter.post(
  '/me/shipping-addresses/:id/select',
  validateRequest({ params: shippingAddressIdParamSchema }),
  usersController.selectShippingAddress,
)
usersRouter.patch('/me', validateRequest({ body: patchMeSchema }), usersController.patchMe)
usersRouter.patch(
  '/me/business',
  validateRequest({ body: patchBusinessSchema }),
  usersController.patchBusiness,
)
