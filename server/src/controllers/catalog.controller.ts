import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { catalogService } from '../modules/catalog/catalog.service.js'
import { AppError } from '../types/errors.js'
import { asyncHandler } from '../utils/async-handler.js'

function positiveIntParam(value: unknown, fallback: number): number {
  if (typeof value !== 'string') return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function boundedPageSize(value: unknown): number {
  return Math.min(60, Math.max(1, positiveIntParam(value, 24)))
}

export const catalogController = {
  categories: asyncHandler(async (req: Request, res: Response) => {
    const data = await catalogService.listCategories(req.correlationId)
    res.json(ok(data))
  }),

  products: asyncHandler(async (req: Request, res: Response) => {
    const categorySlug = typeof req.query.category === 'string' ? req.query.category : undefined
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : undefined
    const page = positiveIntParam(req.query.page, 1)
    const pageSize = boundedPageSize(req.query.pageSize)
    const data = await catalogService.listProducts(req.correlationId, {
      categorySlug,
      q: q || undefined,
      page,
      pageSize,
    })
    res.json(ok(data))
  }),

  productBySlug: asyncHandler(async (req: Request, res: Response) => {
    const product = await catalogService.getProduct(req.correlationId, req.params.slug)
    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Not found', 'Prodotto non trovato.', 404, false)
    }
    res.json(ok(product))
  }),
}
