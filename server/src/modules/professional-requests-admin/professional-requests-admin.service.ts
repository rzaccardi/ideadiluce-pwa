import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import {
  normalizeProfessionalRequestStatus,
  type ProfessionalRequestStatus,
} from '../professional-account/professional-account.constants.js'
import { professionalAccountRepository } from '../professional-account/professional-account.repository.js'
import type {
  ProfessionalRequestsAdminDetailDTO,
  ProfessionalRequestsAdminListDTO,
  ProfessionalRequestsAdminListItemDTO,
} from './professional-requests-admin.types.js'
import type { professionalRequestsAdminListQuerySchema } from './professional-requests-admin.validators.js'
import type { z } from 'zod'

function toListItem(row: {
  id: string
  companyName: string
  vatNumber: string
  sector: string
  contactName: string
  email: string
  phone: string | null
  status: string
  locale: string
  createdAt: Date
}): ProfessionalRequestsAdminListItemDTO {
  return {
    id: row.id,
    companyName: row.companyName,
    vatNumber: row.vatNumber,
    sector: row.sector,
    contactName: row.contactName,
    email: row.email,
    phone: row.phone,
    status: normalizeProfessionalRequestStatus(row.status),
    locale: row.locale,
    createdAt: row.createdAt.toISOString(),
  }
}

function toDetail(row: NonNullable<Awaited<ReturnType<typeof professionalAccountRepository.findById>>>) {
  return {
    ...toListItem(row),
    message: row.message,
    sectorOther: row.sectorOther,
    userId: row.userId,
    country: row.country,
    pec: row.pec,
    sdiCode: row.sdiCode,
    visuraUrl: row.visuraUrl,
    odooPartnerId: row.odooPartnerId,
    vatValidated: row.vatValidated,
    vatForceAccepted: row.vatForceAccepted,
    odooSyncError: row.odooSyncError,
    adminNotes: row.adminNotes,
    updatedAt: row.updatedAt.toISOString(),
  }
}

async function applyApprovalEffects(userId: string | null) {
  if (!userId) return
  await prisma.user.update({
    where: { id: userId },
    data: {
      customerSegment: 'PROFESSIONAL',
      isProfessional: true,
    },
  })
}

export const professionalRequestsAdminService = {
  async list(
    query: z.infer<typeof professionalRequestsAdminListQuerySchema>,
  ): Promise<ProfessionalRequestsAdminListDTO> {
    const where: Prisma.ProfessionalAccountRequestWhereInput = {}
    if (query.status !== 'all') where.status = query.status
    if (query.days) {
      where.createdAt = { gte: new Date(Date.now() - query.days * 86400000) }
    }
    if (query.q?.trim()) {
      const q = query.q.trim()
      where.OR = [
        { companyName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { vatNumber: { contains: q, mode: 'insensitive' } },
        { contactName: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, rows] = await Promise.all([
      professionalAccountRepository.count(where),
      professionalAccountRepository.list({
        where,
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

  async getById(id: string): Promise<ProfessionalRequestsAdminDetailDTO> {
    let row = await professionalAccountRepository.findById(id)
    if (!row) {
      throw new AppError(
        'PROFESSIONAL_REQUEST_NOT_FOUND',
        'Request not found',
        'Richiesta non trovata.',
        404,
        false,
      )
    }

    const status = normalizeProfessionalRequestStatus(row.status)
    if (status === 'NEW') {
      row = await professionalAccountRepository.updateStatus(id, 'IN_REVIEW')
    }

    return toDetail(row)
  },

  async updateStatus(id: string, status: ProfessionalRequestStatus): Promise<ProfessionalRequestsAdminDetailDTO> {
    return this.patch(id, { status })
  },

  async patch(
    id: string,
    input: { status?: ProfessionalRequestStatus; adminNotes?: string | null },
  ): Promise<ProfessionalRequestsAdminDetailDTO> {
    const existing = await professionalAccountRepository.findById(id)
    if (!existing) {
      throw new AppError(
        'PROFESSIONAL_REQUEST_NOT_FOUND',
        'Request not found',
        'Richiesta non trovata.',
        404,
        false,
      )
    }

    const row = await professionalAccountRepository.update(id, {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
    })

    if (input.status === 'APPROVED' && normalizeProfessionalRequestStatus(existing.status) !== 'APPROVED') {
      await applyApprovalEffects(row.userId)
    }

    return toDetail(row)
  },
}
