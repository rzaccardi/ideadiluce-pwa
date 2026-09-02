import { describe, expect, it } from 'vitest'
import {
  earlierSagaOperations,
  isPaidOrderStatus,
  normalizeOperation,
  sagaIndex,
  toOperationDto,
} from './odoo-sync-operations.js'

describe('odoo-sync-operations', () => {
  it('normalizza alias e DTO', () => {
    expect(normalizeOperation('ENSURE_PARTNER')).toBe('ensure_partner')
    expect(normalizeOperation('register_payment')).toBe('funnel_sync')
    expect(toOperationDto('ensure_sale_order')).toBe('ENSURE_SALE_ORDER')
  })

  it('ordina la saga: partner prima dell’ordine, pagamento dopo le righe', () => {
    expect(sagaIndex('ensure_partner')).toBeLessThan(sagaIndex('ensure_sale_order'))
    expect(sagaIndex('reconcile_lines')).toBeLessThan(sagaIndex('funnel_sync'))
    expect(earlierSagaOperations('funnel_sync')).toEqual([
      'ensure_partner',
      'ensure_sale_order',
      'reconcile_lines',
    ])
    expect(earlierSagaOperations('ensure_portal_user')).toContain('ensure_partner')
  })

  it('riconosce ordini pagati', () => {
    expect(isPaidOrderStatus('PAID_SYNC_PENDING', 'CAPTURED')).toBe(true)
    expect(isPaidOrderStatus('CHECKOUT_LOCKED', 'NOT_STARTED')).toBe(false)
  })
})
