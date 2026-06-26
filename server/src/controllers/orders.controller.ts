import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { ordersService } from '../modules/orders/orders.service.js'
import { paymentsService } from '../modules/payments/payments.service.js'
import { asyncHandler } from '../utils/async-handler.js'

export const ordersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    const data = await ordersService.list(userId, req.correlationId)
    res.json(ok(data))
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    const data = await ordersService.getById(userId, req.params.id, req.correlationId)
    res.json(ok(data))
  }),

  recommendations: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    const data = await ordersService.recommendations(req, userId, req.params.id)
    res.json(ok(data))
  }),

  reorder: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    const data = await ordersService.reorder(req, userId, req.params.id)
    res.json(ok(data))
  }),

  status: asyncHandler(async (req: Request, res: Response) => {
    const data = await paymentsService.status(req, req.params.id)
    res.json(ok(data))
  }),

  thankYou: asyncHandler(async (req: Request, res: Response) => {
    const data = await paymentsService.thankYou(req, req.params.id)
    res.json(ok(data))
  }),

  abandon: asyncHandler(async (req: Request, res: Response) => {
    const data = await paymentsService.abandon(req, req.params.id)
    res.json(ok(data))
  }),

  listInvoices: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    const data = await ordersService.listInvoices(userId, req.correlationId)
    res.json(ok(data))
  }),
}
