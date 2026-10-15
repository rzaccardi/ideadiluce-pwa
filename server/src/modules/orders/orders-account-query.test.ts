import { describe, expect, it } from 'vitest'
import { ACCOUNT_VISIBLE_PWA_ORDER_STATUSES } from './orders.constants.js'
import { buildAccountPwaOrderWhere } from './orders-account-query.js'

describe('buildAccountPwaOrderWhere', () => {
  it('abbina odooPartnerId o email, anche se odooPartnerId è già valorizzato', () => {
    expect(buildAccountPwaOrderWhere(42, 'hello@robertozaccardi.dev')).toEqual({
      OR: [
        {
          AND: [
            { OR: [{ odooPartnerId: 42 }, { email: 'hello@robertozaccardi.dev' }] },
            { orderStatus: { in: ACCOUNT_VISIBLE_PWA_ORDER_STATUSES } },
          ],
        },
        {
          AND: [
            { OR: [{ odooPartnerId: 42 }, { email: 'hello@robertozaccardi.dev' }] },
            { paymentStatus: 'CAPTURED' },
          ],
        },
      ],
    })
  })
})
