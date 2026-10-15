import type { Prisma } from '@prisma/client'
import { ACCOUNT_VISIBLE_PWA_ORDER_STATUSES } from './orders.constants.js'

/** Ordini PWA visibili in account: pagati/sync, bonifico in attesa, oppure Stripe captured. */
export function buildAccountPwaOrderWhere(
  odooPartnerId: number,
  emailLower?: string | null,
): Prisma.PwaOrderWhereInput {
  const owner: Prisma.PwaOrderWhereInput[] = [{ odooPartnerId }]
  if (emailLower) owner.push({ email: emailLower })
  return {
    OR: [
      { AND: [{ OR: owner }, { orderStatus: { in: ACCOUNT_VISIBLE_PWA_ORDER_STATUSES } }] },
      { AND: [{ OR: owner }, { paymentStatus: 'CAPTURED' }] },
    ],
  }
}
