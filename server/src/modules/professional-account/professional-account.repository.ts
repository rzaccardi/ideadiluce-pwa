import { prisma } from '../../lib/prisma.js'
import {
  PROFESSIONAL_REQUEST_OPEN_STATUSES,
  type ProfessionalRequestStatus,
} from './professional-account.constants.js'

export const professionalAccountRepository = {
  create(data: {
    companyName: string
    vatNumber: string
    sector: string
    sectorOther?: string | null
    contactName: string
    email: string
    phone?: string | null
    pec?: string | null
    sdiCode?: string | null
    visuraUrl?: string | null
    message?: string | null
    locale?: string
    country?: string
    status?: string
    odooPartnerId?: number | null
    vatValidated?: boolean
    vatForceAccepted?: boolean
    odooSyncError?: string | null
  }) {
    return prisma.professionalAccountRequest.create({ data })
  },

  update(
    id: string,
    data: {
      status?: string
      odooPartnerId?: number | null
      vatValidated?: boolean
      vatForceAccepted?: boolean
      odooSyncError?: string | null
      adminNotes?: string | null
      visuraUrl?: string | null
    },
  ) {
    return prisma.professionalAccountRequest.update({ where: { id }, data })
  },

  findById(id: string) {
    return prisma.professionalAccountRequest.findUnique({ where: { id } })
  },

  findLatestForAccount(params: { odooPartnerId?: number | null; email: string }) {
    const email = params.email.toLowerCase().trim()
    return prisma.professionalAccountRequest.findFirst({
      where: {
        OR: [
          ...(params.odooPartnerId != null ? [{ odooPartnerId: params.odooPartnerId }] : []),
          { email },
        ],
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

  hasOpenRequest(params: { odooPartnerId?: number | null; email: string }) {
    const email = params.email.toLowerCase().trim()
    return prisma.professionalAccountRequest.findFirst({
      where: {
        status: { in: [...PROFESSIONAL_REQUEST_OPEN_STATUSES, 'pending'] },
        OR: [
          ...(params.odooPartnerId != null ? [{ odooPartnerId: params.odooPartnerId }] : []),
          { email },
        ],
      },
      select: { id: true },
    })
  },
}
