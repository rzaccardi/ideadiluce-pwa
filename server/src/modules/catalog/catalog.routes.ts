import { Router } from 'express'
import { catalogPublicController } from '../../controllers/catalog-public.controller.js'
import { productDocumentsController } from '../../controllers/product-documents.controller.js'
import { storefrontController } from '../../controllers/storefront.controller.js'
import { restockNotifyController } from '../../controllers/restock-notify.controller.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { stockRestockRequestSchema } from '../restock-notify/restock-notify.validators.js'
import { resolveCodesSchema } from '../cart/cart-quick-reorder.validators.js'
import { requireLogin } from '../../middlewares/session.js'
import { catalogSearchRateLimit } from './catalog-search-rate-limit.js'

/** Catalogo storefront: lista prodotti da Odoo (Arfly), categorie/brand non gestiti nel BFF. */
export const catalogRouter = Router()

catalogRouter.get('/bootstrap', catalogPublicController.bootstrap)
catalogRouter.post(
  '/resolve-codes',
  requireLogin,
  validateRequest({ body: resolveCodesSchema }),
  catalogPublicController.resolveCodes,
)
catalogRouter.get('/categories', catalogPublicController.categories)
catalogRouter.get('/categories/:slug', catalogPublicController.categoryBySlug)
catalogRouter.get('/brands', catalogPublicController.brands)
catalogRouter.get('/brands/:slug', catalogPublicController.brandBySlug)
catalogRouter.get('/products', catalogSearchRateLimit, catalogPublicController.products)
catalogRouter.post('/availability/enrich-detail', catalogPublicController.enrichProductDetail)
catalogRouter.get('/products/:slug/social-proof', storefrontController.productSocialProof)
catalogRouter.get(
  '/products/:slug/documents/:documentId/download',
  productDocumentsController.download,
)
catalogRouter.post(
  '/products/:slug/restock-notify',
  validateRequest({ body: stockRestockRequestSchema }),
  restockNotifyController.create,
)
