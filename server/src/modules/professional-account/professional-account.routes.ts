import { Router } from 'express'
import multer from 'multer'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../lib/api-response.js'
import { professionalAccountService } from './professional-account.service.js'
import { professionalAccountRequestSchema } from './professional-account.validators.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
})

export const professionalAccountRouter = Router()

professionalAccountRouter.post(
  '/',
  upload.single('visura'),
  asyncHandler(async (req, res) => {
    const parsed = professionalAccountRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.message,
          userMessage: 'Controlla i campi del modulo.',
          retriable: false,
          correlationId: req.correlationId,
        },
      })
      return
    }

    const file = req.file
    if (file && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)) {
      res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_FILE',
          message: 'Unsupported visura type',
          userMessage: 'Carica la visura in PDF, JPG o PNG.',
          retriable: false,
          correlationId: req.correlationId,
        },
      })
      return
    }

    res.status(201).json(
      ok(
        await professionalAccountService.submit(
          req,
          parsed.data,
          file
            ? { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype }
            : undefined,
        ),
      ),
    )
  }),
)
