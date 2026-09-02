import type { Prisma } from '@prisma/client'
import type { OdooSyncOperationDTO } from '../../types/odoo.dto.js'

export const ODOO_SAGA_OPERATIONS = [
  'ensure_partner',
  'ensure_sale_order',
  'reconcile_lines',
  'funnel_sync',
  'ensure_portal_user',
  'send_mail',
] as const

export type OdooSyncQueueOperation = (typeof ODOO_SAGA_OPERATIONS)[number]

const OPERATION_ALIASES: Record<string, OdooSyncQueueOperation> = {
  ensure_partner: 'ensure_partner',
  ENSURE_PARTNER: 'ensure_partner',
  ensure_sale_order: 'ensure_sale_order',
  ENSURE_SALE_ORDER: 'ensure_sale_order',
  reconcile_lines: 'reconcile_lines',
  RECONCILE_LINES: 'reconcile_lines',
  funnel_sync: 'funnel_sync',
  FUNNEL_SYNC: 'funnel_sync',
  register_payment: 'funnel_sync',
  REGISTER_PAYMENT: 'funnel_sync',
  ensure_portal_user: 'ensure_portal_user',
  ENSURE_PORTAL_USER: 'ensure_portal_user',
  send_mail: 'send_mail',
  SEND_MAIL: 'send_mail',
}

const DTO_BY_OPERATION: Record<OdooSyncQueueOperation, OdooSyncOperationDTO> = {
  ensure_partner: 'ENSURE_PARTNER',
  ensure_sale_order: 'ENSURE_SALE_ORDER',
  reconcile_lines: 'RECONCILE_LINES',
  funnel_sync: 'FUNNEL_SYNC',
  ensure_portal_user: 'ENSURE_PORTAL_USER',
  send_mail: 'SEND_MAIL',
}

export function normalizeOperation(operation: string): OdooSyncQueueOperation {
  return OPERATION_ALIASES[operation] ?? 'funnel_sync'
}

export function toOperationDto(operation: string): OdooSyncOperationDTO {
  return DTO_BY_OPERATION[normalizeOperation(operation)]
}

export function sagaIndex(operation: string): number {
  const idx = ODOO_SAGA_OPERATIONS.indexOf(normalizeOperation(operation))
  return idx < 0 ? ODOO_SAGA_OPERATIONS.length : idx
}

export function earlierSagaOperations(operation: string): OdooSyncQueueOperation[] {
  const idx = sagaIndex(operation)
  if (idx <= 0) return []
  return ODOO_SAGA_OPERATIONS.slice(0, idx)
}

export type EnqueueOdooSyncInput = {
  pwaOrderId?: string | null
  userId?: string | null
  operation: OdooSyncQueueOperation | OdooSyncOperationDTO | 'register_payment' | 'REGISTER_PAYMENT'
  payload?: Prisma.InputJsonValue
  lastError?: string
  error?: string
  immediate?: boolean
}

export function isPaidOrderStatus(orderStatus: string, paymentStatus: string): boolean {
  return (
    paymentStatus === 'CAPTURED' ||
    orderStatus === 'PAID' ||
    orderStatus === 'PAID_SYNC_PENDING' ||
    orderStatus === 'SYNCED'
  )
}
