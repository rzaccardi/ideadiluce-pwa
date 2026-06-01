import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { wishlistService } from '../modules/wishlist/wishlist.service.js'
import { asyncHandler } from '../utils/async-handler.js'

export const wishlistController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await wishlistService.list(req)
    res.json(ok(data))
  }),

  add: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { productRef: string; variantRef?: string | null }
    const item = await wishlistService.add(req, body)
    res.status(201).json(ok(item))
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await wishlistService.remove(req, req.params.id)
    res.json(ok({ removed: true }))
  }),
}
