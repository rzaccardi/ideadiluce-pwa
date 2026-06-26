import crypto from 'node:crypto'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { writeIntegrationLog } from '../../lib/integration-log.js'
import { generateSessionToken, hashSessionToken } from '../../lib/token-hash.js'
import { AppError } from '../../types/errors.js'
import type { ImpersonationInfoDTO } from '../../types/dto.js'
import { toUserDTO } from '../users/user.mapper.js'

const IMPERSONATION_TOKEN_MINUTES = 5

function tokenExpiry(): Date {
  return new Date(Date.now() + IMPERSONATION_TOKEN_MINUTES * 60 * 1000)
}

function sessionExpiry(): Date {
  return new Date(Date.now() + env.SESSION_DAYS * 24 * 60 * 60 * 1000)
}

function toImpersonationInfo(admin: {
  email: string
  displayName: string | null
}): ImpersonationInfoDTO {
  return {
    adminEmail: admin.email,
    adminDisplayName: admin.displayName,
  }
}

async function logImpersonation(
  operation: string,
  correlationId: string,
  payload: Record<string, unknown>,
) {
  const startedAt = new Date()
  await writeIntegrationLog({
    service: 'admin',
    operation,
    correlationId,
    success: true,
    requestRedacted: payload,
    startedAt,
    finishedAt: new Date(),
  })
}

export const impersonationService = {
  async createTokenForCustomer(
    adminUserId: string,
    customerId: string,
    correlationId: string,
  ): Promise<{ url: string; expiresAt: string }> {
    const user = await prisma.user.findUnique({ where: { id: customerId } })
    if (!user) {
      throw new AppError(
        'CUSTOMER_NOT_FOUND',
        'Customer not found',
        'Cliente non trovato.',
        404,
        false,
      )
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError(
        'CUSTOMER_NOT_IMPERSONATABLE',
        'Customer not active',
        'Impossibile impersonare un account non attivo.',
        400,
        false,
      )
    }

    const adminInUserTable = await prisma.adminUser.findUnique({
      where: { email: user.email },
    })
    if (adminInUserTable) {
      throw new AppError(
        'CANNOT_IMPERSONATE_ADMIN',
        'Cannot impersonate admin account',
        'Non è possibile impersonare un account amministratore.',
        403,
        false,
      )
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = tokenExpiry()

    await prisma.impersonationToken.create({
      data: {
        tokenHash: hashSessionToken(rawToken),
        userId: user.id,
        adminUserId,
        expiresAt,
      },
    })

    await logImpersonation('impersonation.token_created', correlationId, {
      adminUserId,
      customerId: user.id,
      customerEmail: user.email,
    })

    const url = `${env.CLIENT_ORIGIN.replace(/\/$/, '')}/impersonate?token=${encodeURIComponent(rawToken)}`
    return { url, expiresAt: expiresAt.toISOString() }
  },

  async exchangeToken(
    token: string,
    currentSessionId: string | undefined,
    currentTokenRaw: string | null | undefined,
    correlationId: string,
  ) {
    const tokenHash = hashSessionToken(token)
    const row = await prisma.impersonationToken.findUnique({
      where: { tokenHash },
      include: { user: true, adminUser: true },
    })

    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new AppError(
        'INVALID_IMPERSONATION_TOKEN',
        'Invalid impersonation token',
        'Link di impersonazione non valido o scaduto.',
        400,
        false,
      )
    }

    if (row.user.status !== 'ACTIVE') {
      throw new AppError(
        'CUSTOMER_NOT_IMPERSONATABLE',
        'Customer not active',
        'Impossibile impersonare un account non attivo.',
        400,
        false,
      )
    }

    const sessionToken = generateSessionToken()
    const expiresAt = sessionExpiry()

    await prisma.$transaction(async (tx) => {
      await tx.impersonationToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      })

      if (currentTokenRaw) {
        await tx.session.deleteMany({
          where: { tokenHash: hashSessionToken(currentTokenRaw) },
        })
      } else if (currentSessionId) {
        await tx.session.deleteMany({ where: { id: currentSessionId } })
      }

      await tx.session.create({
        data: {
          tokenHash: hashSessionToken(sessionToken),
          userId: row.userId,
          impersonatedByAdminId: row.adminUserId,
          expiresAt,
        },
      })
    })

    await logImpersonation('impersonation.session_started', correlationId, {
      adminUserId: row.adminUserId,
      customerId: row.userId,
      customerEmail: row.user.email,
    })

    return {
      token: sessionToken,
      user: await toUserDTO(row.user),
      impersonation: toImpersonationInfo(row.adminUser),
    }
  },

  async endImpersonation(
    sessionId: string,
    rawToken: string | null | undefined,
    correlationId: string,
  ) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    })

    if (!session?.impersonatedByAdminId) {
      throw new AppError(
        'NOT_IMPERSONATING',
        'Not an impersonation session',
        'Nessuna sessione di impersonazione attiva.',
        400,
        false,
      )
    }

    if (rawToken) {
      await prisma.session.deleteMany({
        where: { tokenHash: hashSessionToken(rawToken) },
      })
    }

    const guestToken = generateSessionToken()
    await prisma.session.create({
      data: {
        tokenHash: hashSessionToken(guestToken),
        expiresAt: sessionExpiry(),
      },
    })

    await logImpersonation('impersonation.session_ended', correlationId, {
      adminUserId: session.impersonatedByAdminId,
      customerId: session.userId,
      customerEmail: session.user?.email,
    })

    return { guestToken }
  },

  async getImpersonationForSession(sessionId: string): Promise<ImpersonationInfoDTO | null> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { impersonatedByAdmin: true },
    })
    if (!session?.impersonatedByAdminId || !session.impersonatedByAdmin) return null
    return toImpersonationInfo(session.impersonatedByAdmin)
  },
}
