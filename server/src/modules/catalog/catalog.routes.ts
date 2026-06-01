import { Router } from 'express'
import { catalogController } from '../../controllers/catalog.controller.js'

export const catalogRouter = Router()

catalogRouter.get('/categories', catalogController.categories)
catalogRouter.get('/products', catalogController.products)
catalogRouter.get('/products/:slug', catalogController.productBySlug)
