import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { ArrowLeftIcon } from 'lucide-react'
import {
  adminOrdersStore,
  fetchAdminOrderDetail,
  resetAdminOrderDetail,
  retryOdooSyncQueueItem,
  retryOrderSyncById,
} from '@/features/orders'
import { formatMoney } from '@/lib/format'
import {
  DetailField,
  DetailPageActionBar,
  DetailValue,
  RouteSkeleton,
  SitePageHeader,
} from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { OdooHubProductLink } from '@/components/orders/odoo-hub-product-link'
import { OdooSaleOrderLink } from '@/components/orders/odoo-sale-order-link'

const INSIGHT_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  success: 'default',
  warning: 'destructive',
  info: 'secondary',
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const orders = useSnapshot(adminOrdersStore)

  useEffect(() => {
    if (!id) return
    void fetchAdminOrderDetail(id)
    return () => {
      resetAdminOrderDetail()
    }
  }, [id])

  if (orders.detailLoading || (orders.detailId === id && !orders.detail && !orders.detailError)) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio ordine" />
        <RouteSkeleton variant="detail" />
      </div>
    )
  }

  if (orders.detailError && orders.detailId === id && !orders.detail) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio ordine" />
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{orders.detailError}</AlertDescription>
        </Alert>
        <Button variant="outline" render={<Link to="/orders" />}>
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Torna agli ordini
        </Button>
      </div>
    )
  }

  const order = orders.detail
  if (!order || order.id !== id) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SitePageHeader
          title={order.odooOrderName ?? `Ordine ${order.id.slice(0, 8)}…`}
          description={`${order.email} · ${order.sourceLabel} · ${order.orderStatus} · ${order.paymentStatus}`}
        />
        <DetailPageActionBar
          secondary={
            <Button variant="outline" className="w-full lg:w-auto" render={<Link to="/orders" />}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Elenco ordini
            </Button>
          }
        />
      </div>

      {order.uxInsights.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {order.uxInsights.map((insight) => (
              <Badge key={insight.code} variant={INSIGHT_VARIANT[insight.severity] ?? 'outline'}>
                {insight.title}
              </Badge>
            ))}
          </div>
          {order.uxInsights.some((i) => i.code === 'single_item') ? (
            <p className="text-sm text-muted-foreground">
              Il cliente vede suggerimenti accessori in area ordini e dopo il pagamento.
            </p>
          ) : null}
        </div>
      ) : null}

      {order.odooLastSyncStatus === 'FAILED' ? (
        <Alert variant="destructive">
          <AlertTitle>Sincronizzazione Odoo fallita</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {order.odooSyncQueue?.lastError ??
                order.lastPaymentError ??
                'La sync con Odoo non è andata a buon fine.'}
            </p>
            {order.odooSyncQueue ? (
              <p className="text-sm">
                Tentativi automatici: {order.odooSyncQueue.attempts}/{order.odooSyncQueue.maxAttempts}
                {' · '}
                Prossimo retry:{' '}
                {new Date(order.odooSyncQueue.nextRetryAt).toLocaleString('it-IT')}
              </p>
            ) : null}
            {orders.syncRetryError ? (
              <p className="text-sm">{orders.syncRetryError}</p>
            ) : null}
            <Button
              variant="outline"
              disabled={
                orders.syncRetryLoading ||
                order.odooSyncQueue?.status === 'EXHAUSTED'
              }
              onClick={() => {
                if (order.odooSyncQueue) {
                  void retryOdooSyncQueueItem(order.odooSyncQueue.id, order.id)
                } else {
                  void retryOrderSyncById(order.id)
                }
              }}
            >
              {orders.syncRetryLoading ? <Spinner className="h-4 w-4" /> : null}
              Riprova sync Odoo
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pagamento & Odoo</CardTitle>
            <CardDescription>Stato sincronizzazione e importi</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Stato ordine">
              <DetailValue>{order.orderStatus}</DetailValue>
            </DetailField>
            <DetailField label="Pagamento">
              <DetailValue>{order.paymentStatus}</DetailValue>
            </DetailField>
            <DetailField label="Metodo">
              <DetailValue>{order.paymentMethod ?? '—'}</DetailValue>
            </DetailField>
            <DetailField label="Totale">
              <DetailValue>
                {order.amountTotal != null
                  ? formatMoney(order.amountTotal, order.currencyCode)
                  : '—'}
              </DetailValue>
            </DetailField>
            <DetailField label="Fonte">
              <DetailValue>{order.sourceLabel}</DetailValue>
            </DetailField>
            <DetailField label="Odoo SO">
              <DetailValue>
                {order.odooSaleOrderId != null ? (
                  <OdooSaleOrderLink saleOrderId={order.odooSaleOrderId} />
                ) : (
                  '—'
                )}
              </DetailValue>
            </DetailField>
            {order.clientOrderRef ? (
              <DetailField label="Rif. cliente">
                <DetailValue>{order.clientOrderRef}</DetailValue>
              </DetailField>
            ) : null}
            <DetailField label="Sync Odoo">
              <DetailValue>{order.odooLastSyncStatus ?? (order.isOdooOnly ? 'Solo Odoo' : '—')}</DetailValue>
            </DetailField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline journey</CardTitle>
            <CardDescription>Date chiave del percorso checkout</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex flex-col gap-0.5 border-b py-2 sm:flex-row sm:justify-between sm:gap-4">
              <span className="text-muted-foreground">Creato</span>
              <span className="font-medium sm:font-normal">{new Date(order.createdAt).toLocaleString('it-IT')}</span>
            </div>
            <div className="flex flex-col gap-0.5 border-b py-2 sm:flex-row sm:justify-between sm:gap-4">
              <span className="text-muted-foreground">Checkout avviato</span>
              <span>
                {order.checkoutStartedAt
                  ? new Date(order.checkoutStartedAt).toLocaleString('it-IT')
                  : '—'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 border-b py-2 sm:flex-row sm:justify-between sm:gap-4">
              <span className="text-muted-foreground">Pagamento avviato</span>
              <span className="font-medium sm:font-normal">
                {order.paymentStartedAt
                  ? new Date(order.paymentStartedAt).toLocaleString('it-IT')
                  : '—'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:justify-between sm:gap-4">
              <span className="text-muted-foreground">Pagato</span>
              <span className="font-medium sm:font-normal">
                {order.paidAt ? new Date(order.paidAt).toLocaleString('it-IT') : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Righe ordine</CardTitle>
          <CardDescription>{order.lines.length} articoli</CardDescription>
        </CardHeader>
        <CardContent className="table-bleed mt-0 px-0 pt-0 sm:px-0">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="min-w-[200px]">Prodotto</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead className="text-right">Qtà</TableHead>
                  <TableHead className="text-right">Prezzo</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {order.lines.map((line, i) => (
                <TableRow key={`${line.productRef}-${i}`}>
                  <TableCell>
                    <p className="font-medium">{line.productName ?? line.productRef}</p>
                    {line.productSlug ? (
                      <p className="text-xs text-muted-foreground">{line.productSlug}</p>
                    ) : null}
                    <OdooHubProductLink
                      odooProductId={line.odooTemplateId ?? line.odooProductId}
                      productRef={line.productRef}
                      className="mt-1"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {line.variantRef ?? '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.unitEstimateCents != null
                      ? formatMoney(line.unitEstimateCents, order.currencyCode)
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
