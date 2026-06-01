import { prisma } from '../../lib/prisma.js'

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
  }) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        phone: data.phone ?? null,
      },
    })
  },

  deleteSessionByTokenHash(tokenHash: string) {
    return prisma.session.deleteMany({ where: { tokenHash } })
  },

  linkSessionToUser(sessionId: string, userId: string, expiresAt: Date) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { userId, expiresAt },
    })
  },
}
