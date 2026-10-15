import { prisma } from '../../lib/prisma.js'

export const ordersRepository = {
  listByUser(odooPartnerId: number) {
    return prisma.orderCache.findMany({
      where: { odooPartnerId },
      orderBy: { createdAt: 'desc' },
    })
  },

  findForUser(odooPartnerId: number, id: string) {
    return prisma.orderCache.findFirst({ where: { id, odooPartnerId } })
  },
}
