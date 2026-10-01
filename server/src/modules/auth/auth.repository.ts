import type { CustomerSegment } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { invalidateSessionCacheForSession } from '../../middlewares/session.js'

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  },

  createUser(data: {
    email: string
    passwordHash: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    customerSegment?: CustomerSegment
    companyName?: string | null
    vatNumber?: string | null
  }) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        phone: data.phone ?? null,
        customerSegment: data.customerSegment ?? 'RETAIL',
        companyName: data.companyName?.trim() || null,
        vatNumber: data.vatNumber?.trim() || null,
      },
    })
  },

  deleteSessionByTokenHash(tokenHash: string) {
    return prisma.session.deleteMany({ where: { tokenHash } })
  },

  async linkSessionToUser(sessionId: string, userId: string, expiresAt: Date) {
    invalidateSessionCacheForSession(sessionId)
    return prisma.session.update({
      where: { id: sessionId },
      data: { userId, expiresAt },
    })
  },
}
