import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { ensureOdooPortalUser } from '../../adapters/odoo/odooPortalUserAdapter.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { authRepository } from './auth.repository.js'
import { authService } from './auth.service.js'
import { AppError } from '../../types/errors.js'
import type { UserDTO } from '../../types/dto.js'

const customerAdapter = createOdooCustomerAdapter()

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

async function persistOdooCustomerMap(params: {
  userId: string
  email: string
  odooPartnerId: number
}) {
  const emailLower = normalizeEmail(params.email)
  await prisma.odooCustomerMap.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      odooPartnerId: params.odooPartnerId,
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
    },
    update: {
      odooPartnerId: params.odooPartnerId,
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
      guestEmail: emailLower,
    },
  })
}

/** Crea account PWA + partner/portal Odoo al checkout; password scelta dall'utente. */
export const checkoutRegisterService = {
  async register(
    input: {
      email: string
      password: string
      firstName: string
      lastName: string
      phone?: string
    },
    sessionId: string,
    correlationId: string,
  ): Promise<UserDTO> {
    const normalized = normalizeEmail(input.email)
    const existing = await authRepository.findUserByEmail(normalized)
    if (existing?.passwordHash) {
      throw new AppError(
        'EMAIL_TAKEN',
        'Email already registered',
        'Questa email è già registrata. Accedi con email e password.',
        409,
        false,
      )
    }

    const ctx: OdooCallContext = { correlationId }
    const passwordHash = bcrypt.hashSync(input.password, 10)
    const displayName =
      [input.firstName, input.lastName].filter(Boolean).join(' ').trim() || normalized

    let odooPartnerId: number | null = null

    if (env.ODOO_ENABLED && isOdooConfigured()) {
      const partner = await customerAdapter.findOrCreateCustomer(ctx, {
        email: normalized,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      })
      odooPartnerId = partner.odooPartnerId

      if (odooPartnerId) {
        try {
          await ensureOdooPortalUser(ctx, {
            email: normalized,
            partnerId: odooPartnerId,
            name: displayName,
            password: input.password,
          })
        } catch {
          /* account PWA comunque */
        }
      }
    }

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          firstName: input.firstName.trim() || existing.firstName,
          lastName: input.lastName.trim() || existing.lastName,
          phone: input.phone?.trim() || existing.phone,
        },
      })
    } else {
      await authRepository.createUser({
        email: normalized,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim(),
        customerSegment: 'RETAIL',
      })
    }

    const user = await authRepository.findUserByEmail(normalized)
    if (!user) {
      throw new AppError('REGISTER_FAILED', 'Register failed', 'Registrazione non riuscita.', 500, false)
    }

    if (odooPartnerId) {
      await persistOdooCustomerMap({ userId: user.id, email: normalized, odooPartnerId })
    }

    return authService.loginByVerifiedEmail(normalized, sessionId)
  },
}
