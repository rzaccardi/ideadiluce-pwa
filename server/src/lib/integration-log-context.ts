import { writeIntegrationLog } from './integration-log.js'

type StructuredLogInput = {
  service: string
  operation: string
  correlationId: string
  success: boolean
  statusCode?: number | null
  error?: string | null
  userId?: string | null
  cartId?: string | null
  orderId?: string | null
  quoteId?: string | null
  odooSaleOrderId?: number | null
  checkoutStep?: string | null
  extra?: Record<string, unknown>
}

export async function writeStructuredIntegrationLog(input: StructuredLogInput): Promise<void> {
  const startedAt = new Date()
  await writeIntegrationLog({
    service: input.service,
    operation: input.operation,
    correlationId: input.correlationId,
    success: input.success,
    statusCode: input.statusCode ?? (input.success ? 200 : 500),
    requestRedacted: {
      userId: input.userId ?? undefined,
      cartId: input.cartId ?? undefined,
      orderId: input.orderId ?? undefined,
      quoteId: input.quoteId ?? undefined,
      odooSaleOrderId: input.odooSaleOrderId ?? undefined,
      checkoutStep: input.checkoutStep ?? undefined,
      ...(input.extra ?? {}),
    },
    responseRedacted: input.error ? { error: input.error } : undefined,
    startedAt,
    finishedAt: new Date(),
  })
}
