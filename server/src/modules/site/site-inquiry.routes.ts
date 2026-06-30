import { Router } from 'express'
import multer from 'multer'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../lib/api-response.js'
import { siteInquiryService } from './site-inquiry.service.js'
import { siteInquirySchema } from './site-inquiry.validators.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
})

const imageFields = upload.fields([
  { name: 'productPhoto', maxCount: 1 },
  { name: 'socketPhoto', maxCount: 1 },
  { name: 'attachments', maxCount: 3 },
])

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

function collectAttachments(files: Express.Multer.File[] | undefined) {
  if (!files?.length) return []
  return files
    .filter((file) => ALLOWED_IMAGE_TYPES.has(file.mimetype))
    .map((file) => ({
      filename: file.originalname || 'foto.jpg',
      content: file.buffer,
    }))
}

export const siteInquiryRouter = Router()

siteInquiryRouter.post(
  '/',
  imageFields,
  asyncHandler(async (req, res) => {
    const parsed = siteInquirySchema.safeParse(req.body)
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

    const fileMap = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined
    const attachments = [
      ...collectAttachments(fileMap?.productPhoto),
      ...collectAttachments(fileMap?.socketPhoto),
      ...collectAttachments(fileMap?.attachments),
    ]

    res.status(201).json(ok(await siteInquiryService.submit(parsed.data, attachments)))
  }),
)
