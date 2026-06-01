import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export const cartRepository = {
  findActiveBySession(sessionId: string) {
    return prisma.cart.findFirst({
      where: { sessionId, status: 'ACTIVE' },
      include: { items: true },
    })
  },

  findActiveByUser(userId: string) {
    return prisma.cart.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { items: true },
    })
  },

  create(data: Prisma.CartCreateInput) {
    return prisma.cart.create({ data, include: { items: true } })
  },

  updateTotals(
    id: string,
    data: Pick<Prisma.CartUpdateInput, 'estimatedSubtotal' | 'estimatedTax' | 'estimatedShipping' | 'estimatedTotal' | 'lastPricedAt'>,
  ) {
    return prisma.cart.update({ where: { id }, data, include: { items: true } })
  },

  findItem(cartId: string, itemId: string) {
    return prisma.cartItem.findFirst({ where: { id: itemId, cartId } })
  },

  addItem(data: Prisma.CartItemCreateInput) {
    return prisma.cartItem.create({ data })
  },

  updateItem(id: string, data: Prisma.CartItemUpdateInput) {
    return prisma.cartItem.update({ where: { id }, data })
  },

  deleteItem(id: string) {
    return prisma.cartItem.delete({ where: { id } })
  },

  deleteItems(cartId: string) {
    return prisma.cartItem.deleteMany({ where: { cartId } })
  },

  getWithItems(id: string) {
    return prisma.cart.findUnique({ where: { id }, include: { items: true } })
  },
}
