import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import {
  normalizeSiteInquiryStatus,
  type SiteInquiryStatus,
} from './site-inquiries-admin.constants.js'
import type {
  SiteInquiryAttachmentMetaDTO,
  SiteInquiriesAdminDetailDTO,
  SiteInquiriesAdminListDTO,
  SiteInquiriesAdminListItemDTO,
} from './site-inquiries-admin.types.js'
import type { siteInquiriesAdminListQuerySchema } from './site-inquiries-admin.validators.js'
import type { z } from 'zod'

type Row = Prisma.SiteInquiryGetPayload<object>

function parseAttachments(value: unknown): SiteInquiryAttachmentMetaDTO[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const filename = typeof row.filename === 'string' ? row.filename : null
      if (!filename) return null
      const url = typeof row.url === 'string' ? row.url : null
      return { filename, url }
    })
    .filter((item): item is SiteInquiryAttachmentMetaDTO => item != null)
}

function toListItem(row: Row): SiteInquiriesAdminListItemDTO {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: normalizeSiteInquiryStatus(row.status),
    locale: row.locale,
    productCode: row.productCode,
    createdAt: row.createdAt.toISOString(),
  }
}

function toDetail(row: Row): SiteInquiriesAdminDetailDTO {
  return {
    ...toListItem(row),
    message: row.message,
    brand: row.brand,
    quantity: row.quantity,
    usage: row.usage,
    urgency: row.urgency,
    attachments: parseAttachments(row.attachmentMeta),
    adminNotes: row.adminNotes,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const siteInquiriesAdminService = {
  async list(
    query: z.infer<typeof siteInquiriesAdminListQuerySchema>,
  ): Promise<SiteInquiriesAdminListDTO> {
    const where: Prisma.SiteInquiryWhereInput = {}
    if (query.status !== 'all') where.status = query.status
    if (query.kind !== 'all') where.kind = query.kind
    if (query.days) {
      where.createdAt = { gte: new Date(Date.now() - query.days * 86400000) }
    }
    if (query.q?.trim()) {
      const q = query.q.trim()
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { productCode: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, rows] = await Promise.all([
      prisma.siteInquiry.count({ where }),
      prisma.siteInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ])

    return {
      items: rows.map(toListItem),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },

  async getById(id: string): Promise<SiteInquiriesAdminDetailDTO> {
    let row = await prisma.siteInquiry.findUnique({ where: { id } })
    if (!row) {
      throw new AppError(
        'SITE_INQUIRY_NOT_FOUND',
        'Inquiry not found',
        'Richiesta non trovata.',
        404,
        false,
      )
    }

    if (normalizeSiteInquiryStatus(row.status) === 'NEW') {
      row = await prisma.siteInquiry.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      })
    }

    return toDetail(row)
  },

  async patch(
    id: string,
    input: { status?: SiteInquiryStatus; adminNotes?: string | null },
  ): Promise<SiteInquiriesAdminDetailDTO> {
    const existing = await prisma.siteInquiry.findUnique({ where: { id } })
    if (!existing) {
      throw new AppError(
        'SITE_INQUIRY_NOT_FOUND',
        'Inquiry not found',
        'Richiesta non trovata.',
        404,
        false,
      )
    }

    const row = await prisma.siteInquiry.update({
      where: { id },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
      },
    })

    return toDetail(row)
  },
}
