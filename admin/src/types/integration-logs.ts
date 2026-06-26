export type IntegrationLogDTO = {
  id: string
  service: string
  operation: string
  correlationId: string
  success: boolean
  statusCode: number | null
  durationMs: number | null
  startedAt: string
  finishedAt: string | null
}

export type IntegrationLogsList = {
  items: IntegrationLogDTO[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
