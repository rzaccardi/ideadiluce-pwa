import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import { parseOdooTemplateId } from '../catalog/odooRef.js'
import type { StockRestockAdminStatus } from './restock-admin.constants.js'
import type { RestockAdminDetailDTO, RestockAdminListDTO, RestockAdminListItemDTO } from './restock-admin.types.js'
import type { restockAdminListQuerySchema } from './restock-admin.validators.js'
import type { z } from 'zod'

type Row = Prisma.StockRestockRequestGetPayload<object>

function normalizeAdminStatus(value: string): StockRestockAdminStatus {
  const upper = value.toUpperCase()
  if (upper === 'NEW' || upper === 'IN_PROGRESS' || upper === 'HANDLED' || upper === 'ARCHIVED') {
    return upper
  }
  return 'NEW'
}

function toListItem(row: Row, userEmail: string | null): RestockAdminListItemDTO {
  const templateId = parseOdooTemplateId(row.productRef)
  const isSlug = !/^\d+$/.test(row.productRef.trim()) && templateId == null
  return {
    id: row.id,
    email: row.email,
    productRef: row.productRef,
    productSlug: isSlug ? row.productRef : null,
    productName: row.productName,
    variantRef: row.variantRef || null,
    quantity: row.quantity,
    locale: row.locale,
    userId: row.userId,
    userEmail,
    requestType: row.requestType === 'PRODUCT_REQUEST' ? 'PRODUCT_REQUEST' : 'RESTOCK_NOTIFY',
    adminStatus: normalizeAdminStatus(row.adminStatus),
    adminNotes: row.adminNotes,
    notifiedAt: row.notifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function buildWhere(query: z.infer<typeof restockAdminListQuerySchema>): Prisma.StockRestockRequestWhereInput {
  const where: Prisma.StockRestockRequestWhereInput = {}

  if (query.status === 'pending') where.notifiedAt = null
  if (query.status === 'notified') where.notifiedAt = { not: null }

  if (query.requestType !== 'all') where.requestType = query.requestType
  if (query.adminStatus !== 'all') where.adminStatus = query.adminStatus

  if (query.q?.trim()) {
    const q = query.q.trim()
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { productName: { contains: q, mode: 'insensitive' } },
      { productRef: { contains: q, mode: 'insensitive' } },
      { variantRef: { contains: q, mode: 'insensitive' } },
    ]
  }

  return where
}

async function userEmailsById(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map()
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  })
  return new Map(users.map((u) => [u.id, u.email]))
}

export const restockAdminService = {
  async list(query: z.infer<typeof restockAdminListQuerySchema>): Promise<RestockAdminListDTO> {
    const where = buildWhere(query)
    const skip = (query.page - 1) * query.pageSize

    const [total, rows] = await Promise.all([
      prisma.stockRestockRequest.count({ where }),
      prisma.stockRestockRequest.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
    ])

    const emailMap = await userEmailsById(
      [...new Set(rows.map((r) => r.userId).filter((id): id is string => id != null))],
    )

    return {
      items: rows.map((row) => toListItem(row, row.userId ? (emailMap.get(row.userId) ?? null) : null)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },

  async getById(id: string): Promise<RestockAdminDetailDTO> {
    const row = await prisma.stockRestockRequest.findUnique({
      where: { id },
    })
    if (!row) {
      throw new AppError(
        'RESTOCK_REQUEST_NOT_FOUND',
        'Request not found',
        'Richiesta non trovata.',
        404,
        false,
      )
    }
    const userEmail = row.userId
      ? ((await prisma.user.findUnique({ where: { id: row.userId }, select: { email: true } }))?.email ??
        null)
      : null
    return {
      ...toListItem(row, userEmail),
      odooTemplateId: parseOdooTemplateId(row.productRef),
    }
  },

  async patch(
    id: string,
    input: { adminStatus?: StockRestockAdminStatus; adminNotes?: string | null },
  ): Promise<RestockAdminDetailDTO> {
    const existing = await prisma.stockRestockRequest.findUnique({ where: { id } })
    if (!existing) {
      throw new AppError(
        'RESTOCK_REQUEST_NOT_FOUND',
        'Request not found',
        'Richiesta non trovata.',
        404,
        false,
      )
    }

    const row = await prisma.stockRestockRequest.update({
      where: { id },
      data: {
        ...(input.adminStatus !== undefined ? { adminStatus: input.adminStatus } : {}),
        ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
      },
    })

    const userEmail = row.userId
      ? ((await prisma.user.findUnique({ where: { id: row.userId }, select: { email: true } }))?.email ??
        null)
      : null

    return {
      ...toListItem(row, userEmail),
      odooTemplateId: parseOdooTemplateId(row.productRef),
    }
  },
}
