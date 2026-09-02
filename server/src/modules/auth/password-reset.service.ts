import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { publicAppUrl } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { hashSessionToken } from '../../lib/token-hash.js'
import { AppError } from '../../types/errors.js'
import { requestOdooPasswordReset } from '../../adapters/odoo/odooPortalUserAdapter.js'
import { isOdooConfigured } from '../../adapters/odoo/odooClient.js'
import { sendPwaMail } from '../../adapters/odoo/odooMailAdapter.js'
import { ensurePwaUserStubFromOdoo } from './odoo-account-sync.service.js'
import { isEmergencyMode } from '../odoo/odoo-resilience.settings.js'

function resetExpiry(): Date {
  return new Date(Date.now() + env.PASSWORD_RESET_TOKEN_HOURS * 60 * 60 * 1000)
}

function odooPasswordResetEnabled(correlationId?: string): correlationId is string {
  return Boolean(correlationId && env.ODOO_ENABLED && isOdooConfigured())
}

export const passwordResetService = {
  async requestReset(email: string, correlationId?: string): Promise<void> {
    const normalized = email.toLowerCase().trim()
    const emergency = await isEmergencyMode()

    if (odooPasswordResetEnabled(correlationId) && !emergency) {
      try {
        const result = await requestOdooPasswordReset({ correlationId }, normalized)
        if (result === 'sent') return
        logger.warn('password_reset.odoo_fallback_to_pwa', {
          correlationId,
          email: normalized,
          result,
        })
      } catch (e) {
        logger.warn('password_reset.odoo_failed', {
          correlationId,
          email: normalized,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }

    let user = await prisma.user.findUnique({ where: { email: normalized } })

    if (!user && correlationId) {
      try {
        await ensurePwaUserStubFromOdoo({ correlationId }, normalized)
      } catch {
        /* Odoo giù: solo utenti PWA già presenti */
      }
      user = await prisma.user.findUnique({ where: { email: normalized } })
    }

    if (!user) return

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashSessionToken(rawToken)

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: resetExpiry(),
      },
    })

    const link = publicAppUrl(`/reset-password?token=${encodeURIComponent(rawToken)}`)
    await sendPwaMail(correlationId ? { correlationId } : { correlationId: 'password-reset' }, {
      templateKey: 'password_reset',
      emailTo: user.email,
      vars: {
        hours: String(env.PASSWORD_RESET_TOKEN_HOURS),
        reset_url: link,
      },
    })
  },

  async resetPassword(token: string, password: string, correlationId?: string): Promise<void> {
    if (odooPasswordResetEnabled(correlationId) && !(await isEmergencyMode())) {
      throw new AppError(
        'PASSWORD_RESET_DELEGATED_ODOO',
        'Reset delegated to Odoo',
        'Il reset password avviene dal link ricevuto via email. Richiedi un nuovo link dalla pagina recupero password.',
        400,
        false,
      )
    }

    const tokenHash = hashSessionToken(token)
    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new AppError(
        'INVALID_RESET_TOKEN',
        'Invalid token',
        'Link non valido o scaduto. Richiedi un nuovo reset.',
        400,
        false,
      )
    }

    const passwordHash = bcrypt.hashSync(password, 10)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
    ])
  },
}
