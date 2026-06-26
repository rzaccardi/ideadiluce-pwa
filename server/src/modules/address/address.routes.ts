import { Router } from 'express'
import { addressController } from '../../controllers/address.controller.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { resolveQuerySchema, searchQuerySchema } from './address.validators.js'

export const addressRouter = Router()

addressRouter.get('/status', addressController.status)
addressRouter.get('/search', validateRequest({ query: searchQuerySchema }), addressController.search)
addressRouter.get('/resolve', validateRequest({ query: resolveQuerySchema }), addressController.resolve)
