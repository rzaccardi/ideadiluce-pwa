import { describe, expect, it } from 'vitest'
import { ACCOUNT_VISIBLE_PWA_ORDER_STATUSES } from './orders.constants.js'
import { buildAccountPwaOrderWhere } from './orders-account-query.js'

describe('buildAccountPwaOrderWhere', () => {
  it('abbina userId o email, anche se userId è già valorizzato', () => {
    expect(buildAccountPwaOrderWhere('user-1', 'hello@robertozaccardi.dev')).toEqual({
      OR: [
        {
          AND: [
            { OR: [{ userId: 'user-1' }, { email: 'hello@robertozaccardi.dev' }] },
            { orderStatus: { in: ACCOUNT_VISIBLE_PWA_ORDER_STATUSES } },
          ],
        },
        {
          AND: [
            { OR: [{ userId: 'user-1' }, { email: 'hello@robertozaccardi.dev' }] },
            { paymentStatus: 'CAPTURED' },
          ],
        },
      ],
    })
  })
})
