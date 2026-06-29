import type { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import type {
  wpMigrationBatchBodySchema,
  wpMigrationCompleteBodySchema,
  wpMigrationCreateRunBodySchema,
  wpMigrationProgressBodySchema,
  wpMigrationRecordPatchBodySchema,
  wpMigrationRecordsListQuerySchema,
  wpMigrationRunsListQuerySchema,
} from './wp-seo-migration.validators.js'

type MigrationRow = Record<string, unknown>

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function mapRecordInput(runId: string, batchNumber: number, row: MigrationRow) {
  return {
    runId,
    batchNumber,
    recordType: str(row.record_type) ?? '',
    objectId: str(row.object_id),
    postType: str(row.post_type),
    taxonomy: str(row.taxonomy),
    termId: str(row.term_id),
    currentUrl: str(row.current_url),
    slug: str(row.slug),
    titleWp: str(row.title_wp),
    recommendedAction: str(row.recommended_action),
    nextjsTargetUrl: str(row.nextjs_target_url),
    seoPriority: str(row.seo_priority),
    notes: str(row.notes),
    payload: asJson(row),
  }
}

function mapRun(row: {
  id: string
  externalJobId: string | null
  status: string
  exportType: string
  options: unknown
  sourceUrl: string | null
  phase: string | null
  processed: number
  message: string | null
  errorMessage: string | null
  startedAt: Date
  completedAt: Date | null
  updatedAt: Date
  _count?: { records: number }
}) {
  return {
    id: row.id,
    externalJobId: row.externalJobId,
    status: row.status,
    exportType: row.exportType,
    options: row.options,
    sourceUrl: row.sourceUrl,
    phase: row.phase,
    processed: row.processed,
    recordCount: row._count?.records ?? row.processed,
    message: row.message,
    errorMessage: row.errorMessage,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapRecord(row: {
  id: string
  runId: string
  batchNumber: number
  recordType: string
  objectId: string | null
  postType: string | null
  taxonomy: string | null
  termId: string | null
  currentUrl: string | null
  slug: string | null
  titleWp: string | null
  recommendedAction: string | null
  nextjsTargetUrl: string | null
  seoPriority: string | null
  notes: string | null
  payload: unknown
  createdAt: Date
}) {
  return {
    id: row.id,
    runId: row.runId,
    batchNumber: row.batchNumber,
    recordType: row.recordType,
    objectId: row.objectId,
    postType: row.postType,
    taxonomy: row.taxonomy,
    termId: row.termId,
    currentUrl: row.currentUrl,
    slug: row.slug,
    titleWp: row.titleWp,
    recommendedAction: row.recommendedAction,
    nextjsTargetUrl: row.nextjsTargetUrl,
    seoPriority: row.seoPriority,
    notes: row.notes,
    payload: row.payload,
    createdAt: row.createdAt.toISOString(),
  }
}

export const wpSeoMigrationService = {
  async createRun(body: z.infer<typeof wpMigrationCreateRunBodySchema>) {
    const existing = body.externalJobId
      ? await prisma.wpSeoMigrationRun.findUnique({
          where: { externalJobId: body.externalJobId },
        })
      : null

    if (existing) {
      return mapRun(existing)
    }

    const row = await prisma.wpSeoMigrationRun.create({
      data: {
        externalJobId: body.externalJobId,
        exportType: body.exportType,
        options: body.options ? asJson(body.options) : undefined,
        sourceUrl: body.sourceUrl ?? null,
        status: 'running',
        message: 'Export avviato da WordPress',
      },
    })

    return mapRun(row)
  },

  async ingestBatch(runId: string, body: z.infer<typeof wpMigrationBatchBodySchema>) {
    const run = await prisma.wpSeoMigrationRun.findUnique({ where: { id: runId } })
    if (!run) {
      throw new AppError('NOT_FOUND', 'Run not found', 'Run di migrazione non trovato.', 404, false)
    }

    if (body.rows.length > 0) {
      await prisma.wpSeoMigrationRecord.createMany({
        data: body.rows.map((row) => mapRecordInput(runId, body.batchNumber, row)),
      })
    }

    const processed = body.processed ?? run.processed + body.rows.length
    const updated = await prisma.wpSeoMigrationRun.update({
      where: { id: runId },
      data: {
        phase: body.phase ?? run.phase,
        processed,
        message: body.message ?? run.message,
        status: 'running',
      },
    })

    return {
      runId: updated.id,
      accepted: body.rows.length,
      processed: updated.processed,
      status: updated.status,
    }
  },

  async updateProgress(runId: string, body: z.infer<typeof wpMigrationProgressBodySchema>) {
    const run = await prisma.wpSeoMigrationRun.findUnique({ where: { id: runId } })
    if (!run) {
      throw new AppError('NOT_FOUND', 'Run not found', 'Run di migrazione non trovato.', 404, false)
    }

    const updated = await prisma.wpSeoMigrationRun.update({
      where: { id: runId },
      data: {
        phase: body.phase ?? run.phase,
        processed: body.processed ?? run.processed,
        message: body.message ?? run.message,
        status: body.status ?? run.status,
        errorMessage: body.errorMessage ?? run.errorMessage,
        completedAt: body.status === 'failed' ? new Date() : run.completedAt,
      },
    })

    return mapRun(updated)
  },

  async completeRun(runId: string, body: z.infer<typeof wpMigrationCompleteBodySchema>) {
    const run = await prisma.wpSeoMigrationRun.findUnique({ where: { id: runId } })
    if (!run) {
      throw new AppError('NOT_FOUND', 'Run not found', 'Run di migrazione non trovato.', 404, false)
    }

    const recordCount = await prisma.wpSeoMigrationRecord.count({ where: { runId } })
    const updated = await prisma.wpSeoMigrationRun.update({
      where: { id: runId },
      data: {
        status: 'complete',
        processed: body.processed ?? recordCount,
        message: body.message ?? `Export completato (${recordCount} record).`,
        completedAt: new Date(),
      },
    })

    return mapRun(updated)
  },

  async listRuns(query: z.infer<typeof wpMigrationRunsListQuerySchema>) {
    const where = query.status ? { status: query.status } : {}
    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await Promise.all([
      prisma.wpSeoMigrationRun.count({ where }),
      prisma.wpSeoMigrationRun.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: query.pageSize,
        include: { _count: { select: { records: true } } },
      }),
    ])

    return {
      items: rows.map(mapRun),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },

  async getRun(runId: string) {
    const row = await prisma.wpSeoMigrationRun.findUnique({
      where: { id: runId },
      include: { _count: { select: { records: true } } },
    })
    if (!row) {
      throw new AppError('NOT_FOUND', 'Run not found', 'Run di migrazione non trovato.', 404, false)
    }
    return mapRun(row)
  },

  async listRecords(runId: string, query: z.infer<typeof wpMigrationRecordsListQuerySchema>) {
    const run = await prisma.wpSeoMigrationRun.findUnique({ where: { id: runId }, select: { id: true } })
    if (!run) {
      throw new AppError('NOT_FOUND', 'Run not found', 'Run di migrazione non trovato.', 404, false)
    }

    const where = {
      runId,
      ...(query.recordType ? { recordType: query.recordType } : {}),
      ...(query.q
        ? {
            OR: [
              { currentUrl: { contains: query.q, mode: 'insensitive' as const } },
              { slug: { contains: query.q, mode: 'insensitive' as const } },
              { titleWp: { contains: query.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await Promise.all([
      prisma.wpSeoMigrationRecord.count({ where }),
      prisma.wpSeoMigrationRecord.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: query.pageSize,
      }),
    ])

    return {
      items: rows.map(mapRecord),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },

  async patchRecord(
    runId: string,
    recordId: string,
    body: z.infer<typeof wpMigrationRecordPatchBodySchema>,
  ) {
    const row = await prisma.wpSeoMigrationRecord.findFirst({
      where: { id: recordId, runId },
    })
    if (!row) {
      throw new AppError('NOT_FOUND', 'Record not found', 'Record non trovato.', 404, false)
    }

    const payload =
      row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
        ? { ...(row.payload as Record<string, unknown>) }
        : {}

    if (body.nextjsTargetUrl !== undefined) payload.nextjs_target_url = body.nextjsTargetUrl
    if (body.seoPriority !== undefined) payload.seo_priority = body.seoPriority
    if (body.notes !== undefined) payload.notes = body.notes
    if (body.recommendedAction !== undefined) payload.recommended_action = body.recommendedAction

    const updated = await prisma.wpSeoMigrationRecord.update({
      where: { id: recordId },
      data: {
        nextjsTargetUrl: body.nextjsTargetUrl === undefined ? row.nextjsTargetUrl : body.nextjsTargetUrl,
        seoPriority: body.seoPriority === undefined ? row.seoPriority : body.seoPriority,
        notes: body.notes === undefined ? row.notes : body.notes,
        recommendedAction:
          body.recommendedAction === undefined ? row.recommendedAction : body.recommendedAction,
        payload: asJson(payload),
      },
    })

    return mapRecord(updated)
  },
}
