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
      phone?: string
      customerSegment?: 'retail' | 'business'
      companyName?: string
      vatNumber?: string
      fiscalCode?: string
    },
    sessionId: string,
    correlationId: string,
  ): Promise<UserDTO> {
    const normalized = normalizeEmail(input.email)
    const phone = input.phone?.trim() ?? ''
    const isBusiness = input.customerSegment === 'business'
    const companyName = isBusiness ? input.companyName?.trim() || null : null
    const vatNumber = isBusiness ? input.vatNumber?.trim() || null : null
    const fiscalCode = isBusiness ? input.fiscalCode?.trim() || null : null
    const ctx: OdooCallContext = { correlationId }
    const segment = isBusiness ? ('BUSINESS' as const) : ('RETAIL' as const)

    assertOdooAuthReadyForIdentity()
    const odooRequired = isOdooAuthIdentityRequired()

    let odooPartnerId: number | null = null
    let odooUid: number | null = null

    if (odooRequired) {
      // Un solo check portal: provisionOdooAuthIdentity(rejectExistingPortal) evita
      // il doppio search_read Odoo che c'era qui + dentro provision.
      const odoo = await provisionOdooAuthIdentity(ctx, {
        email: normalized,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        phone,
        rejectExistingPortal: true,
        business: isBusiness
          ? {
              companyName,
              vatNumber,
              fiscalCode,
              isCompany: true,
            }
          : undefined,
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
        phone,
        customerSegment: segment,
        companyName,
        vatNumber,
        fiscalCode,
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
            phone: phone || existing.phone,
            customerSegment: segment,
            companyName,
            vatNumber,
            fiscalCode,
          },
        })
      } else {
        user = await authRepository.createUser({
          email: normalized,
          passwordHash,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          phone,
          customerSegment: segment,
          companyName,
          vatNumber,
          fiscalCode,
        })
      }
    }

    return authService.establishLoggedInSession({
      user,
      sessionId,
      odooPartnerId,
      odooUid,
      cartMode: 'adopt_session',
    })
  },
}
