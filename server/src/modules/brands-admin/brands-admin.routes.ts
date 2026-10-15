import { Router } from 'express'
import multer from 'multer'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { AppError } from '../../types/errors.js'
import { brandsAdminService } from './brands-admin.service.js'
import { brandLogoVariantSchema } from './brands-admin.validators.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
})

export const brandsAdminRouter = Router()

brandsAdminRouter.use(loadAdminSession, requireAdminAuth)

brandsAdminRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(ok(await brandsAdminService.list()))
  }),
)

/** Registra in DB i JPG già presenti in `client/public/brands` come logo light. */
brandsAdminRouter.post(
  '/seed-static-logos',
  asyncHandler(async (_req, res) => {
    res.json(ok(await brandsAdminService.seedStaticLogos()))
  }),
)

/** Solo rimozione loghi: non elimina il brand Odoo. */
brandsAdminRouter.delete(
  '/:slug',
  asyncHandler(async (req, res) => {
    res.json(ok(await brandsAdminService.clearLogos(req.params.slug)))
  }),
)

brandsAdminRouter.post(
  '/:slug/logo',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const variantParsed = brandLogoVariantSchema.safeParse(
      typeof req.body?.variant === 'string' ? req.body.variant : undefined,
    )
    if (!variantParsed.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid logo variant',
        'Indica la variante del logo: light o dark.',
        400,
      )
    }
    if (!req.file) {
      throw new AppError(
        'MISSING_FILE',
        'Logo file required',
        'Seleziona un file immagine da caricare.',
        400,
      )
    }
    res.json(
      ok(
        await brandsAdminService.uploadLogo(req.params.slug, variantParsed.data, {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
        }),
      ),
    )
  }),
)

brandsAdminRouter.delete(
  '/:slug/logo/:variant',
  asyncHandler(async (req, res) => {
    const variantParsed = brandLogoVariantSchema.safeParse(req.params.variant)
    if (!variantParsed.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid logo variant',
        'Variante logo non valida (light o dark).',
        400,
      )
    }
    res.json(ok(await brandsAdminService.deleteLogo(req.params.slug, variantParsed.data)))
  }),
)
