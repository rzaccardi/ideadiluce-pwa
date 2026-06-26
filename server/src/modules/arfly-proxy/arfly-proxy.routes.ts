import { Router } from 'express'
import { arflyProxyController } from './arfly-proxy.controller.js'

/** Proxy trasparente verso Odoo/Arfly API v2 (tlb_idl_ecommerce). */
export const arflyProxyRouter = Router()

arflyProxyRouter.get('/products', arflyProxyController.products)
arflyProxyRouter.get('/product/by-slug', arflyProxyController.productBySlug)
arflyProxyRouter.get('/product/:productId', arflyProxyController.productById)
