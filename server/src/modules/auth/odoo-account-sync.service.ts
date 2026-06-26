import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { generateAccountPassword } from '../../lib/generate-password.js'
import { publicAppUrl } from '../../lib/mail.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { sendOdooTransactionalMail } from '../../adapters/odoo/odooMailAdapter.js'
import {
  ensureOdooPortalUser,
  findOdooPortalUserByEmail,
} from '../../adapters/odoo/odooPortalUserAdapter.js'
import {
  isOdooConfigured,
  odooAuthenticatePortalUser,
  type OdooCallContext,
} from '../../adapters/odoo/odooClient.js'
import { authRepository } from './auth.repository.js'
import { authService, sessionExpiry } from './auth.service.js'
import type { UserDTO } from '../../types/dto.js'
import type { OdooCustomerProfile } from '../../adapters/odoo/odooCustomerAdapter.js'

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

export async function loginWithOdooCredentials(
  ctx: OdooCallContext,
  email: string,
  password: string,
  sessionId: string,
): Promise<UserDTO | null> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return null

  const normalized = normalizeEmail(email)
  const odooUid = await odooAuthenticatePortalUser(ctx, normalized, password)
  if (!odooUid) return null

  let profile: OdooCustomerProfile | null = null
  let odooPartnerId: number | null = null

  profile = await customerAdapter.getCustomerProfileByEmail(ctx, normalized)
  const partner = await customerAdapter.findCustomerByEmail(ctx, normalized)
  odooPartnerId = partner?.odooPartnerId ?? null
  if (!odooPartnerId) {
    const portal = await findOdooPortalUserByEmail(ctx, normalized)
    odooPartnerId = portal?.odooPartnerId ?? null
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const existing = await authRepository.findUserByEmail(normalized)

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        firstName: profile?.firstName?.trim() || existing.firstName,
        lastName: profile?.lastName?.trim() || existing.lastName,
        phone: profile?.phone?.trim() || existing.phone,
      },
    })
  } else {
    const user = await authRepository.createUser({
      email: normalized,
      passwordHash,
      firstName: profile?.firstName?.trim() || undefined,
      lastName: profile?.lastName?.trim() || undefined,
      phone: profile?.phone?.trim() || undefined,
      customerSegment: 'RETAIL',
    })

    if (profile?.line1?.trim()) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          shippingAddressJson: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            line1: profile.line1,
            line2: profile.line2 ?? '',
            city: profile.city,
            postalCode: profile.postalCode,
            country: profile.country,
            phone: profile.phone ?? '',
          },
        },
      })
    }

    if (odooPartnerId) {
      await persistOdooCustomerMap({
        userId: user.id,
        email: normalized,
        odooPartnerId,
      })
    }
  }

  if (existing && odooPartnerId) {
    await persistOdooCustomerMap({
      userId: existing.id,
      email: normalized,
      odooPartnerId,
    })
  }

  return authService.loginByVerifiedEmail(normalized, sessionId)
}

/** Crea utente PWA da profilo Odoo senza password (es. reset password per account solo portal). */
export async function ensurePwaUserStubFromOdoo(
  ctx: OdooCallContext,
  email: string,
): Promise<boolean> {
  const normalized = normalizeEmail(email)
  const existing = await authRepository.findUserByEmail(normalized)
  if (existing) return true

  if (!env.ODOO_ENABLED || !isOdooConfigured()) return false

  const portal = await findOdooPortalUserByEmail(ctx, normalized)
  if (!portal) return false

  const profile = await customerAdapter.getCustomerProfileByEmail(ctx, normalized)
  const user = await prisma.user.create({
    data: {
      email: normalized,
      passwordHash: null,
      firstName: profile?.firstName?.trim() || null,
      lastName: profile?.lastName?.trim() || null,
      phone: profile?.phone?.trim() || null,
      customerSegment: 'RETAIL',
    },
  })

  if (profile?.line1?.trim()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        shippingAddressJson: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          line1: profile.line1,
          line2: profile.line2 ?? '',
          city: profile.city,
          postalCode: profile.postalCode,
          country: profile.country,
          phone: profile.phone ?? '',
        },
      },
    })
  }

  await persistOdooCustomerMap({
    userId: user.id,
    email: normalized,
    odooPartnerId: portal.odooPartnerId,
  })

  return true
}

export async function provisionOdooAccountAfterOrder(
  ctx: OdooCallContext,
  input: {
    orderId: string
    email: string
    odooPartnerId: number | null
    shippingProfile: OdooCustomerProfile | null
    sessionId: string | null
  },
): Promise<void> {
  const normalized = normalizeEmail(input.email)
  const existing = await authRepository.findUserByEmail(normalized)

  const name =
    [input.shippingProfile?.firstName, input.shippingProfile?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || normalized

  let odooPartnerId = input.odooPartnerId
  if (!odooPartnerId && env.ODOO_ENABLED && isOdooConfigured()) {
    const partner = await customerAdapter.findCustomerByEmail(ctx, normalized)
    odooPartnerId = partner?.odooPartnerId ?? null
  }

  const plainPassword = generateAccountPassword()
  let odooUserCreated = false

  if (odooPartnerId && env.ODOO_ENABLED && isOdooConfigured()) {
    try {
      const portal = await ensureOdooPortalUser(ctx, {
        email: normalized,
        partnerId: odooPartnerId,
        name,
        password: plainPassword,
      })
      odooUserCreated = portal.created
    } catch {
      /* account PWA comunque */
    }
  }

  let userId = existing?.id ?? null
  let shouldSendCredentials = false
  if (!existing) {
    const user = await authRepository.createUser({
      email: normalized,
      passwordHash: bcrypt.hashSync(plainPassword, 10),
      firstName: input.shippingProfile?.firstName?.trim() || undefined,
      lastName: input.shippingProfile?.lastName?.trim() || undefined,
      phone: input.shippingProfile?.phone?.trim() || undefined,
      customerSegment: 'RETAIL',
    })
    userId = user.id
    shouldSendCredentials = true
  } else if (!existing.passwordHash) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash: bcrypt.hashSync(plainPassword, 10) },
    })
    userId = existing.id
    shouldSendCredentials = true
  } else {
    userId = existing.id
  }

  if (userId && odooPartnerId) {
    await persistOdooCustomerMap({ userId, email: normalized, odooPartnerId })
  }

  if (input.sessionId && userId) {
    await authRepository.linkSessionToUser(input.sessionId, userId, sessionExpiry())
  }

  const loginUrl = publicAppUrl('/login')
  const firstName = input.shippingProfile?.firstName?.trim()
  if (shouldSendCredentials) {
    await sendOdooTransactionalMail(ctx, {
      emailTo: normalized,
      subject: 'Il tuo account Idea di Luce',
      bodyText: `Ciao${firstName ? ` ${firstName}` : ''},\n\n${
        odooUserCreated
          ? 'Abbiamo creato il tuo account sul portale Idea di Luce (sincronizzato con Odoo).'
          : 'Il tuo account Idea di Luce è stato attivato.'
      }\n\nEmail: ${normalized}\nPassword temporanea: ${plainPassword}\n\nAccedi da: ${loginUrl}\n\nTi consigliamo di cambiare la password dopo il primo accesso.`,
    })
  }
}
