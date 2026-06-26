import type { Request, Response } from 'express'
import { productDocumentsService } from '../modules/catalog/product-documents.service.js'
import { asyncHandler } from '../utils/async-handler.js'

export const productDocumentsController = {
  download: asyncHandler(async (req: Request, res: Response) => {
    const variantRef =
      typeof req.query.variantRef === 'string' ? req.query.variantRef : undefined
    const sourcePage =
      typeof req.query.source === 'string' ? req.query.source : undefined
    const url = await productDocumentsService.resolveDownloadUrl(
      req,
      req.params.slug,
      req.params.documentId,
      { variantRef, sourcePage },
    )
    res.redirect(302, url)
  }),
}
