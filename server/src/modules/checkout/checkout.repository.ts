import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export const checkoutRepository = {
  create(data: Prisma.CheckoutSessionCreateInput) {
    return prisma.checkoutSession.create({ data })
  },

  findById(id: string) {
    return prisma.checkoutSession.findUnique({
      where: { id },
      include: { cart: true },
    })
  },

  update(id: string, data: Prisma.CheckoutSessionUpdateInput) {
    return prisma.checkoutSession.update({ where: { id }, data })
  },

  nextAttemptNo(checkoutSessionId: string) {
    return prisma.checkoutAttempt
      .aggregate({ where: { checkoutSessionId }, _max: { attemptNo: true } })
      .then((r) => (r._max.attemptNo ?? 0) + 1)
  },

  addAttempt(data: Prisma.CheckoutAttemptUncheckedCreateInput) {
    return prisma.checkoutAttempt.create({ data })
  },
}
