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

/** Persistenza IntegrationLog disabilitata: non serve in produzione. */
export async function writeIntegrationLog(_params: WriteParams): Promise<void> {
  return
}
