import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { addCartItemSchema, patchCartItemSchema } from './cart.validators.js'
import { syncCartFromClientSchema } from './cart-sync.validators.js'
import { cartController } from '../../controllers/cart.controller.js'

export const cartRouter = Router()

cartRouter.get('/', cartController.get)
cartRouter.post('/sync-from-client', validateRequest({ body: syncCartFromClientSchema }), cartController.syncFromClient)
cartRouter.post('/items', validateRequest({ body: addCartItemSchema }), cartController.addItem)
cartRouter.patch('/items/:id', validateRequest({ body: patchCartItemSchema }), cartController.patchItem)
cartRouter.delete('/items/:id', cartController.removeItem)
cartRouter.delete('/', cartController.clear)
cartRouter.get('/recommendations', cartController.recommendations)
cartRouter.get('/stock', cartController.checkStock)
cartRouter.post('/reprice', cartController.reprice)
