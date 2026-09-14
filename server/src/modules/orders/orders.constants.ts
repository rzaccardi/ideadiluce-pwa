import type { PwaOrderStatus } from '@prisma/client'

/** Ordini PWA visibili nell'area account cliente, incluso il bonifico in attesa di accredito. */
export const ACCOUNT_VISIBLE_PWA_ORDER_STATUSES: PwaOrderStatus[] = [
  'PAYMENT_PENDING',
  'PAID',
  'PAID_SYNC_PENDING',
  'SYNCED',
  'CONFIRMED',
  'COMPLETED',
]
