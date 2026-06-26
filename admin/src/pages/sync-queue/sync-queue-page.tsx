import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { OdooSaleOrderLink } from '@/components/orders/odoo-sale-order-link'
import { RoutePageHeader } from '@/components/route-page-header'
import { InfiniteScrollSentinel, SearchInput, TableFilters, TableSkeleton } from '@/components/shared'
import { fetchOdooSyncQueueListDeduped, odooStore, retryOdooSyncQueueItem } from '@/features/odoo'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { formatDateTime } from '@/lib/format'
import type { OdooSyncQueueItem } from '@/types/odoo'

const PAGE_SIZE = 25

type StatusFilter = 'all' | OdooSyncQueueItem['status']

function buildListQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  })
  const status = searchParams.get('status')
  const pwaOrderId = searchParams.get('pwaOrderId')
  if (status && status !== 'all') params.set('status', status)
  if (pwaOrderId) params.set('pwaOrderId', pwaOrderId)
  return params.toString()
}

function statusBadgeVariant(status: OdooSyncQueueItem['status']) {
  if (status === 'COMPLETED') return 'default' as const
  if (status === 'EXHAUSTED') return 'destructive' as const
  return 'secondary' as const
}

export function SyncQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orderIdFilter, setOrderIdFilter] = useState(searchParams.get('pwaOrderId') ?? '')
  const store = useSnapshot(odooStore)

  const status = (searchParams.get('status') ?? 'all') as StatusFilter
  const page = Number(searchParams.get('page') ?? '1')
  const listQuery = useMemo(() => buildListQuery(searchParams, page), [searchParams, page])

  const hasMore =
    store.syncQueueList != null &&
    store.syncQueueList.page < store.syncQueueList.totalPages &&
    store.syncQueueListItems.length > 0

  useEffect(() => {
    void fetchOdooSyncQueueListDeduped(listQuery, { append: page > 1 })
  }, [listQuery, page])

  const loadMore = useCallback(() => {
    if (store.syncQueueListLoading || store.syncQueueListLoadingMore || !hasMore || !store.syncQueueList) {
      return
    }
    const p = new URLSearchParams(searchParams)
    p.set('page', String(store.syncQueueList.page + 1))
    setSearchParams(p, { replace: true })
  }, [
    hasMore,
    store.syncQueueList,
    store.syncQueueListLoading,
    store.syncQueueListLoadingMore,
    searchParams,
    setSearchParams,
  ])

  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loading: store.syncQueueListLoadingMore,
    onLoadMore: loadMore,
  })

  function setStatusFilter(next: StatusFilter) {
    const p = new URLSearchParams(searchParams)
    if (next === 'all') p.delete('status')
    else p.set('status', next)
    p.delete('page')
    setSearchParams(p, { replace: true })
  }

  function applyFilters(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams(searchParams)
    if (orderIdFilter.trim()) p.set('pwaOrderId', orderIdFilter.trim())
    else p.delete('pwaOrderId')
    p.delete('page')
    setSearchParams(p, { replace: true })
  }

  const exhaustedCount = store.syncQueueListItems.filter((i) => i.status === 'EXHAUSTED').length

  return (
    <div className="space-y-6">
      <RoutePageHeader
        description={
          store.syncQueueList != null
            ? `${store.syncQueueList.total} job in coda · retry sync Odoo post-pagamento`
            : 'Retry automatici sync Odoo post-pagamento'
        }
      />

      {exhaustedCount > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Sync esaurite — intervento richiesto</AlertTitle>
          <AlertDescription>
            {exhaustedCount} job in stato EXHAUSTED nella lista corrente. È stata inviata email a
            info@ideadiluce.com. Filtra per stato &quot;Esaurito&quot; per gestirli.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Coda sync</CardTitle>
          <CardDescription>
            Operazioni FUNNEL_SYNC e RECONCILE_LINES con tentativi e prossimo retry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={applyFilters}>
            <TableFilters
              search={
                <SearchInput
                  id="sync-queue-order-id"
                  value={orderIdFilter}
                  onChange={(e) => setOrderIdFilter(e.target.value)}
                  placeholder="ID ordine PWA…"
                />
              }
              filters={
                <div className="flex flex-col gap-1.5 sm:min-w-[180px]">
                  <Label htmlFor="sync-queue-status">Stato</Label>
                  <Select value={status} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger id="sync-queue-status" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="PENDING">In attesa</SelectItem>
                      <SelectItem value="PROCESSING">In elaborazione</SelectItem>
                      <SelectItem value="COMPLETED">Completato</SelectItem>
                      <SelectItem value="EXHAUSTED">Esaurito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            />
          </form>

          {store.syncQueueListError ? (
            <Alert variant="destructive">
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{store.syncQueueListError}</AlertDescription>
            </Alert>
          ) : null}

          {store.syncQueueList != null && !store.syncQueueList.configured ? (
            <Alert>
              <AlertTitle>Odoo non configurato</AlertTitle>
              <AlertDescription>
                La coda sync è disponibile ma l&apos;integrazione Odoo potrebbe non essere attiva.
              </AlertDescription>
            </Alert>
          ) : null}

          {store.syncQueueListLoading && store.syncQueueListItems.length === 0 ? (
            <TableSkeleton
              rows={8}
              columns={['Ordine', 'Operazione', 'Stato', 'Tentativi', 'Prossimo retry', 'Odoo', '']}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordine PWA</TableHead>
                  <TableHead>Operazione</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Tentativi</TableHead>
                  <TableHead>Prossimo retry</TableHead>
                  <TableHead>Odoo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.syncQueueListItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nessun job in coda.
                    </TableCell>
                  </TableRow>
                ) : (
                  store.syncQueueListItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-0">
                        <Link
                          to={`/orders/${item.pwaOrderId}`}
                          className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                        >
                          {item.pwaOrderId}
                        </Link>
                        {item.orderEmail ? (
                          <p className="truncate text-sm text-muted-foreground">{item.orderEmail}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{item.operation}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.attempts}/{item.maxAttempts}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(item.nextRetryAt)}
                      </TableCell>
                      <TableCell>
                        <OdooSaleOrderLink saleOrderId={item.odooSaleOrderId} />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={item.status === 'EXHAUSTED' || store.syncQueueRetryingId === item.id}
                          onClick={() => void retryOdooSyncQueueItem(item.id, listQuery)}
                        >
                          {store.syncQueueRetryingId === item.id ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            'Riprova'
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <InfiniteScrollSentinel ref={sentinelRef} loading={store.syncQueueListLoadingMore} />
        </CardContent>
      </Card>
    </div>
  )
}
