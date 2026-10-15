import { prisma } from '../../lib/prisma.js'

export const wishlistRepository = {
  listForPartner(odooPartnerId: number) {
    return prisma.wishlistItem.findMany({
      where: { odooPartnerId },
      orderBy: { createdAt: 'desc' },
    })
  },

  listForSession(sessionId: string) {
    return prisma.wishlistItem.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async addForPartner(odooPartnerId: number, productRef: string, variantRef: string | null) {
    const existing = await prisma.wishlistItem.findFirst({
      where: { odooPartnerId, productRef, variantRef },
    })
    if (existing) return existing
    return prisma.wishlistItem.create({
      data: { odooPartnerId, productRef, variantRef },
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

  deleteForPartner(odooPartnerId: number, id: string) {
    return prisma.wishlistItem.deleteMany({ where: { id, odooPartnerId } })
  },

  deleteForSession(sessionId: string, id: string) {
    return prisma.wishlistItem.deleteMany({ where: { id, sessionId } })
  },
}
