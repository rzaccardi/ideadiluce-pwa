import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import {
  assertOdooAuthReadyForIdentity,
  isOdooAuthIdentityRequired,
  provisionOdooAuthIdentity,
} from './odoo-account-sync.service.js'
import { ensureSatelliteProjection } from './satellite-projection.service.js'
import { authRepository } from './auth.repository.js'
import { authService } from './auth.service.js'
import { AppError } from '../../types/errors.js'
import type { UserDTO } from '../../types/dto.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { findOdooPortalUserByEmail } from '../../adapters/odoo/odooPortalUserAdapter.js'

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

/**
 * Checkout register: identità Odoo (partner+portal), poi solo proiezione satellite.
 * Non usa findUserByEmail / passwordHash come autorità.
 */
export const checkoutRegisterService = {
  async register(
    input: {
      email: string
      password: string
      firstName: string
      lastName: string
      phone: string
      customerSegment?: 'retail' | 'business'
    },
    sessionId: string,
    correlationId: string,
  ): Promise<UserDTO> {
    const normalized = normalizeEmail(input.email)
    const ctx: OdooCallContext = { correlationId }
    const segment =
      input.customerSegment === 'business' ? ('BUSINESS' as const) : ('RETAIL' as const)

    assertOdooAuthReadyForIdentity()
    const odooRequired = isOdooAuthIdentityRequired()

    let odooPartnerId: number | null = null
    let odooUid: number | null = null

    if (odooRequired) {
      const existingPortal = await findOdooPortalUserByEmail(ctx, normalized)
      if (existingPortal) {
        // Portal già presente: non inventare account PWA: l'utente deve fare login.
        throw new AppError(
          'EMAIL_TAKEN',
          'Email already registered on Odoo portal',
          'Questa email è già registrata. Accedi con email e password.',
          409,
          false,
        )
      }

      const odoo = await provisionOdooAuthIdentity(ctx, {
        email: normalized,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        rejectExistingPortal: true,
      })
      odooPartnerId = odoo.odooPartnerId
      odooUid = odoo.odooUserId
    } else {
      const existing = await authRepository.findSatelliteByEmail(normalized)
      if (existing?.passwordHash) {
        throw new AppError(
          'EMAIL_TAKEN',
          'Email already registered',
          'Questa email è già registrata. Accedi con email e password.',
          409,
          false,
        )
      }
    }

    let user
    if (odooPartnerId) {
      user = await ensureSatelliteProjection({
        odooPartnerId,
        email: normalized,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        customerSegment: segment,
        clearLocalPassword: true,
      })
    } else {
      const passwordHash = bcrypt.hashSync(input.password, 10)
      const existing = await authRepository.findSatelliteByEmail(normalized)
      if (existing) {
        user = await prisma.customerSatellite.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            firstName: input.firstName.trim() || existing.firstName,
            lastName: input.lastName.trim() || existing.lastName,
            phone: input.phone.trim() || existing.phone,
            customerSegment: segment,
          },
        })
      } else {
        user = await authRepository.createUser({
          email: normalized,
          passwordHash,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          phone: input.phone.trim(),
          customerSegment: segment,
        })
      }
    }

    return authService.establishLoggedInSession({
      user,
      sessionId,
      odooPartnerId,
      odooUid,
    })
  },
}
