import { prisma } from '../../lib/prisma.js'
import type { ProfessionalRequestStatus } from './professional-account.constants.js'
import { PROFESSIONAL_REQUEST_OPEN_STATUSES } from './professional-account.constants.js'

export const professionalAccountRepository = {
  create(data: {
    companyName: string
    vatNumber: string
    sector: string
    sectorOther: string | null
    contactName: string
    email: string
    phone: string | null
    pec: string | null
    sdiCode: string | null
    visuraUrl: string | null
    message: string | null
    locale: string
    country: string
    userId: string | null
    vatValidated: boolean
    vatForceAccepted: boolean
    odooPartnerId: number | null
    odooSyncError: string | null
    status?: ProfessionalRequestStatus
  }) {
    return prisma.professionalAccountRequest.create({
      data: {
        ...data,
        status: data.status ?? 'NEW',
      },
    })
  },

  update(
    id: string,
    data: {
      userId?: string
      visuraUrl?: string | null
      odooPartnerId?: number | null
      odooSyncError?: string | null
      status?: ProfessionalRequestStatus
      adminNotes?: string | null
    },
  ) {
    return prisma.professionalAccountRequest.update({ where: { id }, data })
  },

  findById(id: string) {
    return prisma.professionalAccountRequest.findUnique({ where: { id } })
  },

  findLatestForAccount(params: { userId: string; email: string }) {
    const email = params.email.toLowerCase().trim()
    return prisma.professionalAccountRequest.findFirst({
      where: {
        OR: [{ userId: params.userId }, { email }],
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  list(params: { where: object; skip: number; take: number }) {
    return prisma.professionalAccountRequest.findMany({
      where: params.where,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    })
  },

  count(where: object) {
    return prisma.professionalAccountRequest.count({ where })
  },

  updateStatus(id: string, status: ProfessionalRequestStatus) {
    return prisma.professionalAccountRequest.update({
      where: { id },
      data: { status },
    })
  },

  hasOpenRequest(params: { userId?: string | null; email: string }) {
    const email = params.email.toLowerCase().trim()
    return prisma.professionalAccountRequest.findFirst({
      where: {
        status: { in: [...PROFESSIONAL_REQUEST_OPEN_STATUSES, 'pending'] },
        OR: [
          ...(params.userId ? [{ userId: params.userId }] : []),
          { email },
        ],
      },
      select: { id: true },
    })
  },
}
