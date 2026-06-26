import { useMemo } from 'react'
import type { OrdersAdminList } from '@/types/orders'
import { formatDateTime, formatMinutes, formatMoney } from '@/lib/format'
import {
  ORDER_FASE_TABLE_COLUMN_CLASS,
  ORDER_JOURNEY_PHASE_LABEL,
  orderJourneyPhase,
  orderJourneyPhaseBadgeClass,
  orderListRowClassName,
  orderListRowHighlight,
} from '@/lib/order-journey-phase'
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  orderStatusPillClass,
  paymentStatusPillClass,
  sortOrdersListItems,
  type OrdersListSort,
} from '@/lib/order-status-display'
import { ORDER_SOURCE_LABEL, type OrderAdminSource } from '@/types/orders'
import { ClickableTableRow, InfiniteScrollTableZone } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { TableCell, TableHead, TableRow } from '@/components/ui/table'

export const ORDERS_TABLE_COLUMNS = [
  'Fonte',
  'Fase',
  'Cliente',
  'Stato',
  'Pagamento',
  'Righe',
  'Importo',
  'Metodo',
  'Odoo',
  'Data',
  'Tempo pag.',
] as const

function orderSourceBadgeClass(source: OrderAdminSource): string {
  switch (source) {
    case 'pwa':
      return 'border-indigo-200 bg-indigo-50 text-indigo-800'
    case 'odoo_manual':
      return 'border-purple-200 bg-purple-50 text-purple-800'
    case 'other_ecommerce':
      return 'border-amber-200 bg-amber-50 text-amber-900'
    case 'odoo_historical':
      return 'border-slate-300 bg-slate-100 text-slate-800'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700'
  }
}

function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

function OrderJourneyPhaseBadge({ orderStatus }: { orderStatus: string }) {
  const phase = orderJourneyPhase(orderStatus)
  return (
    <Badge
      variant="outline"
      className={`shrink-0 border font-medium ${orderJourneyPhaseBadgeClass(phase)}`}
    >
      {ORDER_JOURNEY_PHASE_LABEL[phase]}
    </Badge>
  )
}

const ordersTableHeader = (
  <TableRow className="bg-muted/50 hover:bg-muted/50">
    <TableHead>Fonte</TableHead>
    <TableHead className={ORDER_FASE_TABLE_COLUMN_CLASS}>Fase</TableHead>
    <TableHead className="min-w-[200px] max-w-[280px]">Cliente</TableHead>
    <TableHead>Stato</TableHead>
    <TableHead>Pagamento</TableHead>
    <TableHead className="text-center">Righe</TableHead>
    <TableHead className="text-right">Importo</TableHead>
    <TableHead className="max-w-[120px]">Metodo</TableHead>
    <TableHead>Odoo</TableHead>
    <TableHead className="whitespace-nowrap">Data</TableHead>
    <TableHead className="whitespace-nowrap">Tempo pag.</TableHead>
  </TableRow>
)

type OrdersListTableProps = {
  items: readonly OrdersAdminList['items'][number][]
  sort: OrdersListSort
  loading?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  listReady?: boolean
  sentinelRef?: React.Ref<HTMLDivElement>
  emptyTitle?: string
  emptyDescription?: string
}

export function OrdersListTable({
  items,
  sort,
  loading = false,
  loadingMore = false,
  hasMore = false,
  listReady = false,
  sentinelRef,
  emptyTitle = 'Nessun ordine',
  emptyDescription = 'Nessun ordine con i filtri selezionati.',
}: OrdersListTableProps) {
  const rows = useMemo(() => sortOrdersListItems(items, sort), [items, sort])
  const initialLoading = loading && items.length === 0

  return (
    <InfiniteScrollTableZone
      columns={[...ORDERS_TABLE_COLUMNS]}
      columnCount={ORDERS_TABLE_COLUMNS.length}
      initialLoading={initialLoading}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      listReady={listReady}
      itemsLength={rows.length}
      sentinelRef={sentinelRef}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      tableHeader={ordersTableHeader}
    >
      {rows.map((o) => (
        <ClickableTableRow
          key={o.id}
          to={`/orders/${o.id}`}
          className={orderListRowClassName({
            orderStatus: o.isOdooOnly ? 'COMPLETED' : o.orderStatus,
            highlight: o.isOdooOnly ? false : orderListRowHighlight(o),
            odooLastSyncStatus: o.odooLastSyncStatus,
          })}
        >
          <TableCell>
            <Badge
              variant="outline"
              className={`shrink-0 border font-medium ${orderSourceBadgeClass(o.source)}`}
            >
              {o.sourceLabel || ORDER_SOURCE_LABEL[o.source]}
            </Badge>
          </TableCell>
          <TableCell className={ORDER_FASE_TABLE_COLUMN_CLASS}>
            {o.isOdooOnly ? (
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                Odoo
              </Badge>
            ) : (
              <OrderJourneyPhaseBadge orderStatus={o.orderStatus} />
            )}
          </TableCell>
          <TableCell className="min-w-0 max-w-[280px]">
            <p className="truncate text-sm font-medium text-gray-900" title={o.email}>
              {o.email}
            </p>
            {o.partnerName ? (
              <p className="truncate text-xs text-muted-foreground" title={o.partnerName}>
                {o.partnerName}
              </p>
            ) : null}
            {o.isGuest ? (
              <span className="mt-0.5 inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                Ospite
              </span>
            ) : null}
          </TableCell>
          <TableCell>
            <StatusPill
              label={ORDER_STATUS_LABEL[o.orderStatus] ?? o.orderStatus}
              className={orderStatusPillClass(o.orderStatus)}
            />
          </TableCell>
          <TableCell>
            <StatusPill
              label={PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus}
              className={paymentStatusPillClass(o.paymentStatus)}
            />
          </TableCell>
          <TableCell className="text-center tabular-nums text-sm">{o.lineItemCount}</TableCell>
          <TableCell className="text-right font-medium tabular-nums">
            {o.amountTotal != null ? formatMoney(o.amountTotal, o.currencyCode) : '—'}
          </TableCell>
          <TableCell
            className="max-w-[120px] truncate text-muted-foreground"
            title={o.paymentMethod ?? undefined}
          >
            {o.paymentMethod ?? '—'}
          </TableCell>
          <TableCell className="text-xs tabular-nums text-muted-foreground">
            {o.odooLastSyncStatus === 'FAILED' ? (
              <Badge variant="destructive" className="font-normal">
                Sync fallita
              </Badge>
            ) : o.odooSaleOrderId != null ? (
              `#${o.odooSaleOrderId}`
            ) : (
              '—'
            )}
          </TableCell>
          <TableCell
            className="whitespace-nowrap text-muted-foreground"
            title={formatDateTime(o.createdAt)}
          >
            {formatDateTime(o.createdAt)}
          </TableCell>
          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
            {formatMinutes(o.minutesToPay)}
          </TableCell>
        </ClickableTableRow>
      ))}
    </InfiniteScrollTableZone>
  )
}
