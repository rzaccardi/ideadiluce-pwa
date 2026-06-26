import { AlertTriangleIcon, CheckCircle2Icon, ClockIcon, ReceiptIcon, XCircleIcon } from 'lucide-react'
import type { OrdersAdminList } from '@/types/orders'
import { orderJourneyPhase } from '@/lib/order-journey-phase'
import { Badge } from '@/components/ui/badge'

type OrdersSummaryBadgesProps = {
  items: OrdersAdminList['items']
  total?: number
}

export function OrdersSummaryBadges({ items, total }: OrdersSummaryBadgesProps) {
  let checkout = 0
  let paid = 0
  let problem = 0
  let needsAction = 0
  let odooSyncFailed = 0
  let paidSyncPending = 0

  for (const o of items) {
    const phase = orderJourneyPhase(o.orderStatus)
    if (phase === 'checkout') checkout += 1
    if (phase === 'paid') paid += 1
    if (phase === 'problem') problem += 1
    if (o.odooLastSyncStatus === 'FAILED') odooSyncFailed += 1
    if (o.orderStatus === 'PAID_SYNC_PENDING') paidSyncPending += 1
    if (
      ['PAYMENT_PENDING', 'PAYMENT_FAILED', 'ABANDONED'].includes(o.orderStatus) ||
      (o.orderStatus === 'CHECKOUT_STARTED' && !o.paidAt)
    ) {
      needsAction += 1
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {total != null ? (
        <Badge variant="outline" className="gap-1 hover:bg-muted">
          <ReceiptIcon className="h-3 w-3" aria-hidden />
          {total.toLocaleString('it-IT')} ordini
        </Badge>
      ) : null}
      {needsAction > 0 ? (
        <Badge className="gap-1 bg-amber-100 text-amber-900 hover:bg-amber-100">
          <ClockIcon className="h-3 w-3" aria-hidden />
          {needsAction} da seguire
        </Badge>
      ) : null}
      {checkout > 0 ? (
        <Badge className="gap-1 bg-amber-100 text-amber-900 hover:bg-amber-100">
          <AlertTriangleIcon className="h-3 w-3" aria-hidden />
          {checkout} in checkout
        </Badge>
      ) : null}
      {paid > 0 ? (
        <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
          <CheckCircle2Icon className="h-3 w-3" aria-hidden />
          {paid} pagati
        </Badge>
      ) : null}
      {problem > 0 ? (
        <Badge className="gap-1 bg-red-100 text-red-800 hover:bg-red-100">
          <XCircleIcon className="h-3 w-3" aria-hidden />
          {problem} problemi
        </Badge>
      ) : null}
      {odooSyncFailed > 0 ? (
        <Badge className="gap-1 bg-red-100 text-red-800 hover:bg-red-100">
          <XCircleIcon className="h-3 w-3" aria-hidden />
          {odooSyncFailed} sync Odoo fallite
        </Badge>
      ) : null}
      {paidSyncPending > 0 ? (
        <Badge className="gap-1 bg-orange-100 text-orange-900 hover:bg-orange-100">
          <AlertTriangleIcon className="h-3 w-3" aria-hidden />
          {paidSyncPending} pagati — sync in attesa
        </Badge>
      ) : null}
    </div>
  )
}
