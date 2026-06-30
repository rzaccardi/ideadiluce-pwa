import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { cartService } from '../modules/cart/cart.service.js'
import { cartQuickReorderService } from '../modules/cart/cart-quick-reorder.service.js'
import type { CartAddProductHint } from '../modules/cart/cart.validators.js'
import { asyncHandler } from '../utils/async-handler.js'

export const cartController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const data = await cartService.get(req)
    res.json(ok(data))
  }),

  addItem: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as {
      productRef: string
      variantRef?: string | null
      quantity: number
      productHint?: CartAddProductHint
    }
    const data = await cartService.addItem(req, body)
    res.status(201).json(ok(data))
  }),

  patchItem: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { quantity: number }
    const data = await cartService.patchItem(req, req.params.id, body.quantity)
    res.json(ok(data))
  }),

  removeItem: asyncHandler(async (req: Request, res: Response) => {
    const data = await cartService.removeItem(req, req.params.id)
    res.json(ok(data))
  }),

  clear: asyncHandler(async (req: Request, res: Response) => {
    const data = await cartService.clear(req)
    res.json(ok(data))
  }),

  recommendations: asyncHandler(async (req: Request, res: Response) => {
    const data = await cartService.recommendations(req)
    res.json(ok(data))
  }),

  reprice: asyncHandler(async (req: Request, res: Response) => {
    const data = await cartService.reprice(req)
    res.json(ok(data))
  }),

  syncFromClient: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as {
      items: Array<{ productRef: string; variantRef?: string | null; quantity: number }>
      expiresAt?: string | null
    }
    const data = await cartService.syncFromClient(req, body)
    res.json(ok(data))
  }),

  checkStock: asyncHandler(async (req: Request, res: Response) => {
    const data = await cartService.checkStock(req)
    res.json(ok(data))
  }),

  quickReorder: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { text?: string; lines?: Array<{ code: string; quantity: number }>; locale?: string }
    const data = await cartQuickReorderService.quickReorder(req, body)
    res.status(201).json(ok(data))
  }),
}
