import { prisma } from '../../lib/prisma.js'

export const ordersRepository = {
  listByUser(userId: string) {
    return prisma.orderCache.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  },

  findForUser(userId: string, id: string) {
    return prisma.orderCache.findFirst({ where: { id, userId } })
  },
}
