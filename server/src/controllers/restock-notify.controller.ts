import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { parseHubLocale } from '../lib/hub-locale.js'
import { restockNotifyService } from '../modules/restock-notify/restock-notify.service.js'
import { asyncHandler } from '../utils/async-handler.js'

export const restockNotifyController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as {
      email: string
      quantity: number
      variantRef?: string | null
      requestType?: 'RESTOCK_NOTIFY' | 'PRODUCT_REQUEST'
    }
    const locale = parseHubLocale(req.query.locale)
    const data = await restockNotifyService.requestForSlug(
      req,
      req.params.slug,
      body,
      locale,
    )
    res.status(201).json(ok(data))
  }),
}
