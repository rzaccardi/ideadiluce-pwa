import { prisma } from '../../lib/prisma.js'

export const adminAuthRepository = {
  findUserByEmail(email: string) {
    return prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } })
  },

  deleteSessionByTokenHash(tokenHash: string) {
    return prisma.adminSession.deleteMany({ where: { tokenHash } })
  },

  createSession(adminUserId: string, tokenHash: string, expiresAt: Date) {
    return prisma.adminSession.create({
      data: { adminUserId, tokenHash, expiresAt },
      include: { adminUser: true },
    })
  },
}
