import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { addressService } from '../modules/address/address.service.js'
import type { ResolveQuery, SearchQuery } from '../modules/address/address.validators.js'
import { asyncHandler } from '../utils/async-handler.js'

export const addressController = {
  status: asyncHandler(async (_req: Request, res: Response) => {
    res.json(ok(addressService.status()))
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const { q, country, sessionToken } = req.query as unknown as SearchQuery
    const result = await addressService.search(q, { country, sessionToken })
    res.json(ok(result))
  }),

  resolve: asyncHandler(async (req: Request, res: Response) => {
    const { id, provider, sessionToken } = req.query as unknown as ResolveQuery
    const address = await addressService.resolve(id, provider, sessionToken)
    res.json(ok({ address }))
  }),
}
