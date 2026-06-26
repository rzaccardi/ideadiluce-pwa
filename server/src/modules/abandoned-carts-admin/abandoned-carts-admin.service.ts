import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import { resolveArflyProductLabels } from '../catalog/arfly-product-labels.js'
import type {
  AbandonedCartsAdminDetailDTO,
  AbandonedCartsAdminListDTO,
  AbandonedCartsAdminLineDTO,
} from './abandoned-carts-admin.types.js'
import type { abandonedCartsAdminListQuerySchema } from './abandoned-carts-admin.validators.js'
import type { z } from 'zod'

type LineSnapshot = {
  productRef: string
  variantRef: string | null
  quantity: number
  unitEstimateCents: number | null
}

function parseItemsSnapshot(json: unknown): LineSnapshot[] {
  if (!Array.isArray(json)) return []
  return json
    .filter((row): row is LineSnapshot => {
      if (!row || typeof row !== 'object') return false
      const r = row as Record<string, unknown>
      return typeof r.productRef === 'string' && typeof r.quantity === 'number'
    })
    .map((r) => ({
      productRef: r.productRef,
      variantRef: typeof r.variantRef === 'string' ? r.variantRef : null,
      quantity: r.quantity,
      unitEstimateCents:
        typeof r.unitEstimateCents === 'number' ? r.unitEstimateCents : null,
    }))
}

async function resolveProductLabels(
  refs: string[],
): Promise<Map<string, { slug: string; name: string }>> {
  const labels = await resolveArflyProductLabels(refs)
  const map = new Map<string, { slug: string; name: string }>()
  for (const [ref, label] of labels) {
    map.set(ref, { slug: label.slug, name: label.name })
  }
  return map
}

function mapLines(
  snapshots: LineSnapshot[],
  labels: Map<string, { slug: string; name: string }>,
): AbandonedCartsAdminLineDTO[] {
  return snapshots.map((line) => {
    const info = labels.get(line.productRef)
    return {
      productRef: line.productRef,
      productSlug: info?.slug ?? null,
      productName: info?.name ?? null,
      variantRef: line.variantRef,
      quantity: line.quantity,
      unitEstimateCents: line.unitEstimateCents,
    }
  })
}

export const abandonedCartsAdminService = {
  async list(
    query: z.infer<typeof abandonedCartsAdminListQuerySchema>,
  ): Promise<AbandonedCartsAdminListDTO> {
    const where: Prisma.AbandonedCartEventWhereInput = {}
    if (query.eventType?.trim()) where.eventType = query.eventType.trim()
    if (query.days) {
      where.createdAt = { gte: new Date(Date.now() - query.days * 86400000) }
    }
    if (query.q?.trim()) {
      const q = query.q.trim()
      const matchingUsers = await prisma.user.findMany({
        where: { email: { contains: q, mode: 'insensitive' } },
        select: { id: true },
        take: 50,
      })
      const or: Prisma.AbandonedCartEventWhereInput[] = [
        { contactEmail: { contains: q, mode: 'insensitive' } },
        { cartId: { contains: q, mode: 'insensitive' } },
      ]
      if (matchingUsers.length > 0) {
        or.push({ userId: { in: matchingUsers.map((u) => u.id) } })
      }
      where.OR = or
    }

    const [total, rows] = await Promise.all([
      prisma.abandonedCartEvent.count({ where }),
      prisma.abandonedCartEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ])

    const userIds = [...new Set(rows.map((r) => r.userId).filter((id): id is string => !!id))]
    const usersById = new Map(
      (
        await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true },
        })
      ).map((u) => [u.id, u.email]),
    )

    return {
      items: rows.map((r) => {
        const snapshots = parseItemsSnapshot(r.itemsSnapshotJson)
        return {
          id: r.id,
          cartId: r.cartId,
          eventType: r.eventType,
          contactEmail: r.contactEmail,
          userId: r.userId,
          userEmail: r.userId ? (usersById.get(r.userId) ?? null) : null,
          itemCount: snapshots.length,
          createdAt: r.createdAt.toISOString(),
        }
      }),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },

  async getById(id: string): Promise<AbandonedCartsAdminDetailDTO> {
    const row = await prisma.abandonedCartEvent.findUnique({
      where: { id },
      include: {
        cart: {
          select: {
            status: true,
            estimatedTotal: true,
            createdAt: true,
            abandonedAt: true,
          },
        },
      },
    })
    if (!row) {
      throw new AppError('ABANDONED_CART_NOT_FOUND', 'Not found', 'Carrello non trovato.', 404, false)
    }

    const snapshots = parseItemsSnapshot(row.itemsSnapshotJson)
    const labels = await resolveProductLabels(snapshots.map((l) => l.productRef))

    let userEmail: string | null = null
    if (row.userId) {
      const user = await prisma.user.findUnique({
        where: { id: row.userId },
        select: { email: true },
      })
      userEmail = user?.email ?? null
    }

    return {
      id: row.id,
      cartId: row.cartId,
      eventType: row.eventType,
      contactEmail: row.contactEmail,
      userId: row.userId,
      userEmail,
      itemCount: snapshots.length,
      lines: mapLines(snapshots, labels),
      payloadJson: row.payloadJson,
      createdAt: row.createdAt.toISOString(),
      cart: row.cart
        ? {
            status: row.cart.status,
            estimatedTotal: row.cart.estimatedTotal,
            createdAt: row.cart.createdAt.toISOString(),
            abandonedAt: row.cart.abandonedAt?.toISOString() ?? null,
          }
        : null,
    }
  },
}
