import type { PwaOrderStatus } from '@prisma/client'

/** Ordini PWA visibili nell'area account cliente. */
export const ACCOUNT_VISIBLE_PWA_ORDER_STATUSES: PwaOrderStatus[] = [
  'PAID',
  'PAID_SYNC_PENDING',
  'SYNCED',
  'CONFIRMED',
  'COMPLETED',
]
