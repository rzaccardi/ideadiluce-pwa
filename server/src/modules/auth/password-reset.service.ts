import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { publicAppUrl, sendMail } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { hashSessionToken } from '../../lib/token-hash.js'
import { AppError } from '../../types/errors.js'
import { requestOdooPasswordReset } from '../../adapters/odoo/odooPortalUserAdapter.js'
import { isOdooConfigured } from '../../adapters/odoo/odooClient.js'
import { ensurePwaUserStubFromOdoo } from './odoo-account-sync.service.js'

function resetExpiry(): Date {
  return new Date(Date.now() + env.PASSWORD_RESET_TOKEN_HOURS * 60 * 60 * 1000)
}

function odooPasswordResetEnabled(correlationId?: string): correlationId is string {
  return Boolean(correlationId && env.ODOO_ENABLED && isOdooConfigured())
}

export const passwordResetService = {
  async requestReset(email: string, correlationId?: string): Promise<void> {
    const normalized = email.toLowerCase().trim()

    if (odooPasswordResetEnabled(correlationId)) {
      const result = await requestOdooPasswordReset({ correlationId }, normalized)
      if (result === 'mail_failed') {
        logger.warn('password_reset.odoo_mail_delivery_issue', {
          correlationId,
          email: normalized,
        })
      }
      return
    }

    let user = await prisma.user.findUnique({ where: { email: normalized } })

    if (!user && correlationId) {
      await ensurePwaUserStubFromOdoo({ correlationId }, normalized)
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
    await sendMail({
      to: user.email,
      subject: 'Reimposta la password — Idea di Luce',
      text: `Ciao,\n\nPer reimpostare la password apri questo link (valido ${env.PASSWORD_RESET_TOKEN_HOURS} ore):\n\n${link}\n\nSe non hai richiesto il reset, ignora questa email.`,
    })
  },

  async resetPassword(token: string, password: string, correlationId?: string): Promise<void> {
    if (odooPasswordResetEnabled(correlationId)) {
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
