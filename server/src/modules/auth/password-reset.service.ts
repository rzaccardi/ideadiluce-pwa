import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { publicAppUrl } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { hashSessionToken } from '../../lib/token-hash.js'
import { AppError } from '../../types/errors.js'
import { requestOdooPasswordReset } from '../../adapters/odoo/odooPortalUserAdapter.js'
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

/** Preferisci reset nativo Odoo (auth_signup) quando l'identità portal è la fonte di verità. */
function odooPasswordResetEnabled(): boolean {
  return isOdooAuthIdentityRequired()
}

export const passwordResetService = {
  async requestReset(email: string, correlationId?: string): Promise<void> {
    const normalized = email.toLowerCase().trim()
    const emergency = await isEmergencyMode()
    const ctx = { correlationId: correlationId ?? 'password-reset' }

    if (odooPasswordResetEnabled() && !emergency) {
      try {
        const result = await requestOdooPasswordReset(ctx, normalized)
        if (result === 'sent') return
        // Odoo non trova / non invia: fail-closed — non inventare reset su User locale.
        logger.warn('password_reset.odoo_no_local_fallback', {
          correlationId,
          email: normalized,
          result,
        })
        return
      } catch (e) {
        logger.warn('password_reset.odoo_failed_no_local_fallback', {
          correlationId,
          email: normalized,
          error: e instanceof Error ? e.message : String(e),
        })
        return
      }
    }

    // Path locale / emergency: solo satellite già presente (niente stub inventato da email).
    let user = await prisma.customerSatellite.findUnique({ where: { email: normalized } })

    if (!user && emergency && correlationId) {
      try {
        await ensureSatelliteFromOdooPortal({ correlationId }, normalized)
      } catch {
        /* Odoo giù */
      }
      user = await prisma.customerSatellite.findUnique({ where: { email: normalized } })
    }

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
    // Path PWA: emergency / ODOO_ENABLED=false. Con Odoo attivo la password va solo sul portal.
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
