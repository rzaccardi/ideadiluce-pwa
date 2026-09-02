import { Router } from 'express'
import { addressController } from '../../controllers/address.controller.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { resolveQuerySchema, searchQuerySchema } from './address.validators.js'
import { addressSearchRateLimit } from '../../lib/rate-limiters.js'

export const addressRouter = Router()

addressRouter.get('/status', addressController.status)
addressRouter.get('/search', addressSearchRateLimit, validateRequest({ query: searchQuerySchema }), addressController.search)
addressRouter.get('/resolve', addressSearchRateLimit, validateRequest({ query: resolveQuerySchema }), addressController.resolve)
