import { Router } from 'express'
import type { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { ok } from '../../lib/api-response.js'
import { taxService } from './tax.service.js'
import { vatValidationService } from './vat-validation.service.js'
import { taxValidationService } from './tax-validation.service.js'
import {
  segmentFromDto,
  taxCalculateSchema,
  taxEstimateQuerySchema,
  taxValidateSchema,
  vatValidateSchema,
} from './tax.validators.js'
import { normalizeCountryCode } from './tax.constants.js'
import { subtotalCentsFromCartItems } from '../cart/cartTotals.js'
import { prisma } from '../../lib/prisma.js'
import { resolvePricingContext } from '../pricing/pricelist.service.js'

export const taxRouter = Router()

const taxValidateRateLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Troppe richieste di validazione fiscale.' } },
})

taxRouter.get(
  '/estimate',
  validateRequest({ query: taxEstimateQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof taxEstimateQuerySchema>
    const country = normalizeCountryCode(query.country ?? 'IT')
    let netCents = query.netCents

    if (netCents == null) {
      const session = req.sessionRecord
      const cart = session
        ? await prisma.cart.findFirst({
            where: {
              status: 'ACTIVE',
              OR: [{ sessionId: session.id }, ...(session.userId ? [{ userId: session.userId }] : [])],
            },
            include: { items: true },
            orderBy: { updatedAt: 'desc' },
          })
        : null
      netCents = cart ? (subtotalCentsFromCartItems(cart.items) ?? 0) : 0
    }

    const pricing = await resolvePricingContext(req)
    const breakdown = await taxService.estimateForCart(netCents, country, {
      customerSegment: pricing.segment,
      isProfessional: pricing.segment === 'PROFESSIONAL',
    })
    res.json(ok(breakdown))
  }),
)

taxRouter.post(
  '/calculate',
  validateRequest({ body: taxCalculateSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof taxCalculateSchema>
    const breakdown = await taxService.calculateForCheckout({
      netCents: body.netCents,
      billingCountry: body.billingCountry,
      shippingCountry: body.shippingCountry,
      customerSegment: segmentFromDto(body.customerSegment),
      isProfessional: body.isProfessional ?? body.customerSegment === 'professional',
      vatValid: body.vatValidated ?? null,
      vatForceAccepted: body.vatForceAccepted,
    })
    res.json(ok(breakdown))
  }),
)

taxRouter.post(
  '/validate',
  taxValidateRateLimit,
  validateRequest({ body: taxValidateSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof taxValidateSchema>
    const result = await taxValidationService.validate(
      {
        countryCode: body.countryCode,
        fiscalCode: body.fiscalCode,
        vatNumber: body.vatNumber,
        personType: body.personType,
      },
      {
        userId: req.sessionRecord?.userId,
        sessionId: req.sessionRecord?.id,
        correlationId: req.correlationId,
      },
    )
    res.json(ok(result))
  }),
)

export const vatRouter = Router()

vatRouter.post(
  '/validate',
  validateRequest({ body: vatValidateSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof vatValidateSchema>
    const result = await vatValidationService.validate(req, body.vatNumber, body.countryCode)
    res.json(ok(result))
  }),
)
