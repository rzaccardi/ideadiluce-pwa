import { prisma } from './prisma.js'
import { redactForLog } from './redact.js'
import { logger } from './logger.js'

type WriteParams = {
  service: string
  operation: string
  correlationId: string
  success: boolean
  statusCode?: number | null
  requestRedacted?: unknown
  responseRedacted?: unknown
  startedAt: Date
  finishedAt: Date
}

export async function writeIntegrationLog(params: WriteParams): Promise<void> {
  try {
    await prisma.integrationLog.create({
      data: {
        service: params.service,
        operation: params.operation,
        correlationId: params.correlationId,
        statusCode: params.statusCode ?? null,
        success: params.success,
        requestPayloadRedacted: params.requestRedacted
          ? (redactForLog(params.requestRedacted) as object)
          : undefined,
        responsePayloadRedacted: params.responseRedacted
          ? (redactForLog(params.responseRedacted) as object)
          : undefined,
        startedAt: params.startedAt,
        finishedAt: params.finishedAt,
        durationMs: params.finishedAt.getTime() - params.startedAt.getTime(),
      },
    })
  } catch (e) {
    logger.warn('integration_log.write_failed', { err: String(e) })
  }
}
