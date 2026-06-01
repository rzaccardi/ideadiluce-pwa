import { prisma } from '../../lib/prisma.js'

export const wishlistRepository = {
  listForUser(userId: string) {
    return prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  },

  listForSession(sessionId: string) {
    return prisma.wishlistItem.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async addForUser(userId: string, productRef: string, variantRef: string | null) {
    const existing = await prisma.wishlistItem.findFirst({
      where: { userId, productRef, variantRef },
    })
    if (existing) return existing
    return prisma.wishlistItem.create({
      data: { userId, productRef, variantRef },
    })
  },

  async addForSession(sessionId: string, productRef: string, variantRef: string | null) {
    const existing = await prisma.wishlistItem.findFirst({
      where: { sessionId, productRef, variantRef },
    })
    if (existing) return existing
    return prisma.wishlistItem.create({
      data: { sessionId, productRef, variantRef },
    })
  },

  deleteForUser(userId: string, id: string) {
    return prisma.wishlistItem.deleteMany({ where: { id, userId } })
  },

  deleteForSession(sessionId: string, id: string) {
    return prisma.wishlistItem.deleteMany({ where: { id, sessionId } })
  },
}
