import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { odooIntegrationService } from '../modules/integrations/odoo-integration.service.js'
import type {
  OdooCustomerPrefillQuery,
  OdooPaymentUrlBody,
  OdooTestCheckoutBody,
} from '../modules/integrations/integrations.validators.js'
import { asyncHandler } from '../utils/async-handler.js'

export const integrationsOdooController = {
  ping: asyncHandler(async (req: Request, res: Response) => {
    const data = await odooIntegrationService.ping(req.correlationId)
    res.json(ok(data))
  }),

  docCheck: asyncHandler(async (req: Request, res: Response) => {
    const data = await odooIntegrationService.docCheck(req.correlationId)
    res.json(ok(data))
  }),

  customerPrefill: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as OdooCustomerPrefillQuery
    const data = await odooIntegrationService.customerPrefill(req, query)
    res.json(ok(data))
  }),

  testCheckout: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as OdooTestCheckoutBody
    const data = await odooIntegrationService.testCheckout(req, body)
    res.status(201).json(ok(data))
  }),

  paymentUrl: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as OdooPaymentUrlBody
    const data = await odooIntegrationService.paymentUrl(req.correlationId, body)
    res.json(ok(data))
  }),
}
