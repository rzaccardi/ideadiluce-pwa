import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../lib/api-response.js'
import { requireLogin } from '../../middlewares/session.js'
import { invoicesService } from './invoices.service.js'
import { z } from 'zod'

export const invoicesRouter = Router()

invoicesRouter.use(requireLogin)

invoicesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(ok(await invoicesService.list(req.sessionRecord!.userId!, req.correlationId)))
  }),
)

invoicesRouter.get(
  '/:invoiceId/pdf',
  asyncHandler(async (req, res) => {
    const invoiceId = z.string().min(1).parse(req.params.invoiceId)
    const { buffer, filename } = await invoicesService.downloadPdf(
      req.sessionRecord!.userId!,
      invoiceId,
      req.correlationId,
    )
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  }),
)
