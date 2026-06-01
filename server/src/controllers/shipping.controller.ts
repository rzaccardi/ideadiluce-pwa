import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'
import { shippingService } from '../modules/shipping/shipping.service.js'
import type { QuotesBody, SelectBody } from '../modules/shipping/shipping.validators.js'

export const shippingController = {
  quotes: asyncHandler(async (req: Request, res: Response) => {
    const data = await shippingService.quotes(req, req.body as QuotesBody)
    res.json(ok(data))
  }),

  select: asyncHandler(async (req: Request, res: Response) => {
    const data = await shippingService.select(req, req.body as SelectBody)
    res.json(ok(data))
  }),
}
