import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../lib/api-response.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { requireLogin } from '../../middlewares/session.js'
import { quotesService } from './quotes.service.js'
import {
  odooQuoteParamsSchema,
  quoteIdParamsSchema,
  quoteRequestBodySchema,
} from './quotes.validators.js'

export const quotesRouter = Router()

quotesRouter.use(requireLogin)

quotesRouter.post(
  '/request',
  validateRequest({ body: quoteRequestBodySchema }),
  asyncHandler(async (req, res) => {
    const body = quoteRequestBodySchema.parse(req.body)
    res.status(201).json(ok(await quotesService.request(req, req.sessionRecord!.userId!, body)))
  }),
)

quotesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(ok(await quotesService.list(req.sessionRecord!.userId!, req.correlationId)))
  }),
)

quotesRouter.post(
  '/odoo/:odooSaleOrderId/checkout',
  validateRequest({ params: odooQuoteParamsSchema }),
  asyncHandler(async (req, res) => {
    const { odooSaleOrderId } = odooQuoteParamsSchema.parse(req.params)
    res.json(
      ok(await quotesService.startOdooCheckout(req, req.sessionRecord!.userId!, odooSaleOrderId)),
    )
  }),
)

quotesRouter.get(
  '/:id',
  validateRequest({ params: quoteIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = quoteIdParamsSchema.parse(req.params)
    res.json(
      ok(
        await quotesService.getById(req.sessionRecord!.userId!, id, req.correlationId),
      ),
    )
  }),
)

quotesRouter.post(
  '/:id/checkout',
  validateRequest({ params: quoteIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = quoteIdParamsSchema.parse(req.params)
    res.json(ok(await quotesService.startCheckout(req, req.sessionRecord!.userId!, id)))
  }),
)
