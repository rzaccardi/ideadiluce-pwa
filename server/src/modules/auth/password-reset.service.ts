import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { publicAppUrl } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { hashSessionToken } from '../../lib/token-hash.js'
import { AppError } from '../../types/errors.js'
import { sendPwaMail } from '../../adapters/odoo/odooMailAdapter.js'
import {
  ensureSatelliteFromOdooPortal,
  isOdooAuthIdentityRequired,
  syncPasswordToOdooPortal,
} from './odoo-account-sync.service.js'
import { isEmergencyMode } from '../odoo/odoo-resilience.settings.js'

function resetExpiry(): Date {
  return new Date(Date.now() + env.PASSWORD_RESET_TOKEN_HOURS * 60 * 60 * 1000)
}

export const passwordResetService = {
  /**
   * Emette token PWA e invia `[PWA] Reimposta password` con
   * `{APP_PUBLIC_URL}/reset-password?token=…` (mail via Odoo).
   * Non usa il reset nativo auth_signup (`/web/reset_password`).
   */
  async requestReset(email: string, correlationId?: string): Promise<void> {
    const normalized = email.toLowerCase().trim()
    const emergency = await isEmergencyMode()
    const ctx = { correlationId: correlationId ?? 'password-reset' }
    const odooIdentity = isOdooAuthIdentityRequired()

    let user = await prisma.customerSatellite.findUnique({ where: { email: normalized } })

    // Proietta satellite dal portal Odoo se manca (identità Odoo oppure emergency).
    if (!user && (odooIdentity || emergency)) {
      try {
        const ok = await ensureSatelliteFromOdooPortal(ctx, normalized)
        if (!ok && odooIdentity && !emergency) {
          logger.info('password_reset.odoo_portal_missing_no_mail', {
            correlationId,
            email: normalized,
          })
          return
        }
      } catch (e) {
        logger.warn('password_reset.ensure_satellite_failed', {
          correlationId,
          email: normalized,
          error: e instanceof Error ? e.message : String(e),
        })
        if (odooIdentity && !emergency) return
      }
      user = await prisma.customerSatellite.findUnique({ where: { email: normalized } })
    }

    // Fail-closed: niente email se non esiste un account noto.
    if (!user) return

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashSessionToken(rawToken)

    await prisma.passwordResetToken.create({
      data: {
        odooPartnerId: user.odooPartnerId,
        tokenHash,
        expiresAt: resetExpiry(),
      },
    })

    const link = publicAppUrl(`/reset-password?token=${encodeURIComponent(rawToken)}`)
    await sendPwaMail(ctx, {
      templateKey: 'password_reset',
      emailTo: user.email,
      vars: {
        hours: String(env.PASSWORD_RESET_TOKEN_HOURS),
        reset_url: link,
      },
    })
  },

  async resetPassword(token: string, password: string, correlationId?: string): Promise<void> {
    const tokenHash = hashSessionToken(token)
    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { customer: true },
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

    const customer = row.customer

    if (isOdooAuthIdentityRequired() && !(await isEmergencyMode())) {
      try {
        const synced = await syncPasswordToOdooPortal(
          { correlationId: correlationId ?? 'password-reset' },
          customer.email,
          password,
        )
        if (!synced) {
          logger.warn('password_reset.odoo_portal_missing', {
            correlationId,
            odooPartnerId: row.odooPartnerId,
            email: customer.email,
          })
          throw new AppError(
            'ODOO_PASSWORD_SYNC_FAILED',
            'Odoo portal missing',
            'Non siamo riusciti ad aggiornare la password su Odoo. Riprova tra poco.',
            503,
            true,
          )
        }
      } catch (e) {
        if (e instanceof AppError) throw e
        logger.error('password_reset.odoo_sync_failed', {
          correlationId,
          odooPartnerId: row.odooPartnerId,
          error: e instanceof Error ? e.message : String(e),
        })
        throw new AppError(
          'ODOO_PASSWORD_SYNC_FAILED',
          'Odoo password sync failed',
          'Non siamo riusciti ad aggiornare la password su Odoo. Riprova tra poco.',
          503,
          true,
        )
      }

      await prisma.$transaction([
        prisma.customerSatellite.update({
          where: { odooPartnerId: row.odooPartnerId },
          data: { passwordHash: null },
        }),
        prisma.passwordResetToken.update({
          where: { id: row.id },
          data: { usedAt: new Date() },
        }),
      ])
      return
    }

    const passwordHash = bcrypt.hashSync(password, 10)
    await prisma.$transaction([
      prisma.customerSatellite.update({
        where: { odooPartnerId: row.odooPartnerId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
    ])
  },
}
