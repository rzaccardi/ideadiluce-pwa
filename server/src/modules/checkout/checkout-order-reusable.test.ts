import { describe, expect, it } from 'vitest'
import { ACTIVE_DRAFT_ORDER_STATUSES } from './checkout-order.types.js'

describe('ACTIVE_DRAFT_ORDER_STATUSES', () => {
  it('non include PAYMENT_PENDING (bonifico già inviato non è riusabile)', () => {
    expect(ACTIVE_DRAFT_ORDER_STATUSES).not.toContain('PAYMENT_PENDING')
  })

  it('include ancora gli stati di checkout e retry pagamento fallito', () => {
    expect(ACTIVE_DRAFT_ORDER_STATUSES).toEqual([
      'DRAFT',
      'CART_CREATED',
      'CHECKOUT_STARTED',
      'CHECKOUT_LOCKED',
      'PAYMENT_STARTED',
      'PAYMENT_FAILED',
    ])
  })
})
