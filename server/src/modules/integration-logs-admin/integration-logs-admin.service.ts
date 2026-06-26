import type { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import type { IntegrationLogDTO } from '../../types/dto.js'
import type { integrationLogsListQuerySchema } from './integration-logs-admin.validators.js'

function mapRow(row: {
  id: string
  service: string
  operation: string
  correlationId: string
  success: boolean
  statusCode: number | null
  durationMs: number | null
  startedAt: Date
  finishedAt: Date | null
}): IntegrationLogDTO {
  return {
    id: row.id,
    service: row.service,
    operation: row.operation,
    correlationId: row.correlationId,
    success: row.success,
    statusCode: row.statusCode,
    durationMs: row.durationMs,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
  }
}

export const integrationLogsAdminService = {
  async list(query: z.infer<typeof integrationLogsListQuerySchema>) {
    const where = {
      ...(query.service ? { service: query.service } : {}),
      ...(query.success !== undefined ? { success: query.success } : {}),
    }
    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await Promise.all([
      prisma.integrationLog.count({ where }),
      prisma.integrationLog.findMany({
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
