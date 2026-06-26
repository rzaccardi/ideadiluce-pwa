import type { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import type { documentDownloadsListQuerySchema } from './document-downloads-admin.validators.js'

export type DocumentDownloadAdminItem = {
  id: string
  productSlug: string
  productRef: string | null
  variantRef: string | null
  documentId: string
  documentName: string | null
  userId: string | null
  locale: string
  sourcePage: string | null
  success: boolean
  createdAt: string
}

function mapRow(row: {
  id: string
  productSlug: string
  productRef: string | null
  variantRef: string | null
  documentId: string
  documentName: string | null
  userId: string | null
  locale: string
  sourcePage: string | null
  success: boolean
  createdAt: Date
}): DocumentDownloadAdminItem {
  return {
    id: row.id,
    productSlug: row.productSlug,
    productRef: row.productRef,
    variantRef: row.variantRef,
    documentId: row.documentId,
    documentName: row.documentName,
    userId: row.userId,
    locale: row.locale,
    sourcePage: row.sourcePage,
    success: row.success,
    createdAt: row.createdAt.toISOString(),
  }
}

export const documentDownloadsAdminService = {
  async list(query: z.infer<typeof documentDownloadsListQuerySchema>) {
    const q = query.q?.trim()
    const where = {
      ...(query.productSlug ? { productSlug: query.productSlug } : {}),
      ...(q
        ? {
            OR: [
              { productSlug: { contains: q, mode: 'insensitive' as const } },
              { documentName: { contains: q, mode: 'insensitive' as const } },
              { documentId: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }
    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await Promise.all([
      prisma.productDocumentDownload.count({ where }),
      prisma.productDocumentDownload.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
    ])
    return {
      items: rows.map(mapRow),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },
}
