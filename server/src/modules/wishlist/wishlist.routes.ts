import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { wishlistAddSchema } from './wishlist.validators.js'
import { wishlistController } from '../../controllers/wishlist.controller.js'

export const wishlistRouter = Router()

wishlistRouter.get('/', wishlistController.list)
wishlistRouter.post('/items', validateRequest({ body: wishlistAddSchema }), wishlistController.add)
wishlistRouter.delete('/items/:id', wishlistController.remove)
