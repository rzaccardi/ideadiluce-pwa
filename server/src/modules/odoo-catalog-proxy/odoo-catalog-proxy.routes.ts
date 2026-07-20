import { Router } from 'express'
import { odooCatalogProxyController } from './odoo-catalog-proxy.controller.js'

/** Proxy trasparente verso Odoo/OdooCatalog API v2 (tlb_idl_ecommerce). */
export const odooCatalogProxyRouter = Router()

odooCatalogProxyRouter.get('/products/search', odooCatalogProxyController.productsSearch)
odooCatalogProxyRouter.get('/filters', odooCatalogProxyController.filters)
odooCatalogProxyRouter.get('/products', odooCatalogProxyController.products)
odooCatalogProxyRouter.get('/product/by-slug', odooCatalogProxyController.productBySlug)
odooCatalogProxyRouter.get('/product/:productId', odooCatalogProxyController.productById)
