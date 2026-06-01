import { Router } from 'express'
import { validateRequest } from '../../middlewares/validate-request.js'
import { requireIntegrationAccess } from '../../middlewares/integration-access.js'
import { integrationsOdooController } from '../../controllers/integrations.odoo.controller.js'
import {
  odooCustomerPrefillQuerySchema,
  odooPaymentUrlBodySchema,
  odooTestCheckoutBodySchema,
} from './integrations.validators.js'

export const integrationsApiRouter = Router()

integrationsApiRouter.use(requireIntegrationAccess)
integrationsApiRouter.get('/odoo/ping', integrationsOdooController.ping)
integrationsApiRouter.get('/odoo/doc-check', integrationsOdooController.docCheck)
integrationsApiRouter.get(
  '/odoo/customer-prefill',
  validateRequest({ query: odooCustomerPrefillQuerySchema }),
  integrationsOdooController.customerPrefill,
)
integrationsApiRouter.post(
  '/odoo/test-checkout',
  validateRequest({ body: odooTestCheckoutBodySchema }),
  integrationsOdooController.testCheckout,
)
integrationsApiRouter.post(
  '/odoo/payment-url',
  validateRequest({ body: odooPaymentUrlBodySchema }),
  integrationsOdooController.paymentUrl,
)
