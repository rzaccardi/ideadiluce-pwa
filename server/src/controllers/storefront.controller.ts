import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { socialProofService } from '../modules/social-proof/social-proof.service.js'
import { AppError } from '../types/errors.js'
import { asyncHandler } from '../utils/async-handler.js'

export const storefrontController = {
  productSocialProof: asyncHandler(async (req: Request, res: Response) => {
    const data = await socialProofService.forProductSlug(req.correlationId, req.params.slug)
    if (!data) {
      throw new AppError('PRODUCT_NOT_FOUND', 'Not found', 'Prodotto non trovato.', 404, false)
    }
    res.json(ok(data))
  }),
}
