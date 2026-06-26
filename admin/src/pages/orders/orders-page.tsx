import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { OrdersListTable } from '@/components/orders/orders-list-table'
import { OrdersSummaryBadges } from '@/components/orders/orders-summary-badges'
import { RoutePageHeader } from '@/components/route-page-header'
import { SearchInput, TableFilters } from '@/components/shared'
import { adminOrdersStore, fetchAdminOrdersListDeduped, fetchPaidSyncPending } from '@/features/orders'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import {
  ORDER_JOURNEY_PHASE_FILTER_LABEL,
  ORDER_JOURNEY_PHASE_ORDER,
  ordersFaseCardBorderClass,
  ordersFaseTabDotClass,
  ordersFaseTabTriggerClass,
  type OrderJourneyPhaseFilter,
} from '@/lib/order-journey-phase'
import {
  ORDER_STATUS_FILTER_OPTIONS,
  ORDERS_LIST_SORT_LABEL,
  PAYMENT_STATUS_FILTER_OPTIONS,
  type OrdersListSort,
} from '@/lib/order-status-display'
import { ORDER_SOURCE_FILTER_OPTIONS, type OrderAdminSourceFilter } from '@/types/orders'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25
const DEFAULT_DAYS = 90

function buildListQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    days: searchParams.get('days') ?? String(DEFAULT_DAYS),
  })
  const q = searchParams.get('q')
  if (q) params.set('q', q)
  const source = searchParams.get('source')
  if (source && source !== 'all') params.set('source', source)
  const status = searchParams.get('status')
  if (status && status !== 'all') params.set('status', status)
  const paymentStatus = searchParams.get('paymentStatus')
  if (paymentStatus && paymentStatus !== 'all') params.set('paymentStatus', paymentStatus)
  const fase = searchParams.get('fase')
  if (fase && fase !== 'tutte') params.set('phase', fase)
  const sort = searchParams.get('sort')
  if (sort && sort !== 'action') params.set('sort', sort)
  return params.toString()
}

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const orders = useSnapshot(adminOrdersStore)

  const fase = (searchParams.get('fase') ?? 'tutte') as OrderJourneyPhaseFilter
  const sort = (searchParams.get('sort') ?? 'action') as OrdersListSort
  const source = (searchParams.get('source') ?? 'all') as OrderAdminSourceFilter
  const orderStatus = searchParams.get('status') ?? 'all'
  const paymentStatus = searchParams.get('paymentStatus') ?? 'all'
  const page = Number(searchParams.get('page') ?? '1')

  const listQuery = useMemo(() => buildListQuery(searchParams, page), [searchParams, page])

  const hasMore =
    orders.list != null && orders.list.page < orders.list.totalPages && orders.listItems.length > 0

  useEffect(() => {
    void fetchAdminOrdersListDeduped(listQuery, { append: page > 1 })
  }, [listQuery, page])

  useEffect(() => {
    void fetchPaidSyncPending()
  }, [])

  const loadMore = useCallback(() => {
    if (orders.listLoading || orders.listLoadingMore || !hasMore || !orders.list) return
    const p = new URLSearchParams(searchParams)
    p.set('page', String(orders.list.page + 1))
    setSearchParams(p, { replace: true })
  }, [hasMore, orders.list, orders.listLoading, orders.listLoadingMore, searchParams, setSearchParams])

  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loading: orders.listLoadingMore,
    onLoadMore: loadMore,
  })

  function setFase(next: OrderJourneyPhaseFilter) {
    const p = new URLSearchParams(searchParams)
    if (next === 'tutte') p.delete('fase')
    else p.set('fase', next)
    p.set('page', '1')
    setSearchParams(p)
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams(searchParams)
    if (q.trim()) p.set('q', q.trim())
    else p.delete('q')
    p.set('page', '1')
    setSearchParams(p)
  }

  function setFilterParam(key: string, value: string, allValue = 'all') {
    const p = new URLSearchParams(searchParams)
    if (!value || value === allValue) p.delete(key)
    else p.set(key, value)
    p.set('page', '1')
    setSearchParams(p)
  }

  function resetFilters() {
    setQ('')
    setSearchParams({ days: String(DEFAULT_DAYS), page: '1' })
  }

  const hasActiveFilters =
    Boolean(searchParams.get('q')) ||
    (searchParams.get('fase') ?? 'tutte') !== 'tutte' ||
    (searchParams.get('source') ?? 'all') !== 'all' ||
    (searchParams.get('status') ?? 'all') !== 'all' ||
    (searchParams.get('paymentStatus') ?? 'all') !== 'all'

  const emptyDescription =
    fase === 'tutte'
      ? 'Nessun ordine nel periodo selezionato. Prova «Tutto lo storico» o allarga la finestra temporale.'
      : `Nessun ordine PWA in fase «${ORDER_JOURNEY_PHASE_FILTER_LABEL[fase]}».`

  const data = orders.list
  const items = orders.listItems

  return (
    <div className="space-y-6">
      <RoutePageHeader
        description={
          data != null
            ? `${data.total.toLocaleString('it-IT')} ordini nel periodo (PWA + Odoo live)`
            : 'Ordini PWA e storico Odoo sincronizzato live'
        }
      />

      {orders.paidSyncPending != null && orders.paidSyncPending.count > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>
            {orders.paidSyncPending.count} ordine/i pagati — sync Odoo in attesa
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Clienti con pagamento ricevuto ma ordine non ancora sincronizzato su Odoo. Intervieni
              subito con «Riprova sync» nel dettaglio ordine.
            </p>
            <ul className="list-inside list-disc text-sm">
              {orders.paidSyncPending.items.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link to={`/orders/${o.id}`} className="font-medium underline-offset-4 hover:underline">
                    {o.email}
                  </Link>
                  {o.amountTotal != null
                    ? ` · € ${(o.amountTotal / 100).toFixed(2)}`
                    : null}
                  {o.lastPaymentError ? ` — ${o.lastPaymentError.slice(0, 80)}` : null}
                </li>
              ))}
            </ul>
            {orders.paidSyncPending.count > 5 ? (
              <p className="text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterParam('status', 'PAID_SYNC_PENDING')}
                >
                  Mostra tutti nella lista
                </Button>
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {orders.listError ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{orders.listError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className={cn('shadow-sm transition-colors', ordersFaseCardBorderClass(fase))}>
        <CardHeader className="space-y-4 border-b pb-4">
          <div>
            <CardTitle>Elenco ordini</CardTitle>
            <CardDescription>
              Vista unificata: ordini e-commerce PWA e storico Odoo letto live via API. Filtra per
              fonte, cliente, stato ordine e pagamento; usa le schede fase per il journey PWA.
              Scorri in basso per altri risultati.
            </CardDescription>
          </div>
          <div
            className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-muted/40 p-1"
            role="tablist"
            aria-label="Fase ordine"
          >
            {ORDER_JOURNEY_PHASE_ORDER.map((key) => {
              const active = fase === key
              const dotPhase = key === 'tutte' ? null : key
              return (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'ghost'}
                  role="tab"
                  aria-selected={active}
                  className={cn('gap-1.5', ordersFaseTabTriggerClass(key, active))}
                  onClick={() => setFase(key)}
                >
                  {dotPhase ? (
                    <span
                      className={cn('h-2 w-2 shrink-0 rounded-full', ordersFaseTabDotClass(dotPhase))}
                      aria-hidden
                    />
                  ) : null}
                  {ORDER_JOURNEY_PHASE_FILTER_LABEL[key]}
                </Button>
              )
            })}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <OrdersSummaryBadges items={[...items]} total={data?.total} />

          <form className="mt-4" onSubmit={applySearch}>
            <TableFilters
              search={
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="orders-q" className="text-sm text-gray-500">
                    Cliente
                  </Label>
                  <SearchInput
                    id="orders-q"
                    placeholder="Email o nome cliente…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              }
              filters={
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="orders-source" className="text-sm text-gray-500">
                      Fonte
                    </Label>
                    <Select value={source} onValueChange={(v) => v && setFilterParam('source', v)}>
                      <SelectTrigger id="orders-source" className="w-full sm:w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_SOURCE_FILTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="orders-status" className="text-sm text-gray-500">
                      Stato ordine
                    </Label>
                    <Select
                      value={orderStatus}
                      onValueChange={(v) => v && setFilterParam('status', v)}
                    >
                      <SelectTrigger id="orders-status" className="w-full sm:w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti gli stati</SelectItem>
                        {ORDER_STATUS_FILTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="orders-payment-status" className="text-sm text-gray-500">
                      Stato pagamento
                    </Label>
                    <Select
                      value={paymentStatus}
                      onValueChange={(v) => v && setFilterParam('paymentStatus', v)}
                    >
                      <SelectTrigger id="orders-payment-status" className="w-full sm:w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i pagamenti</SelectItem>
                        {PAYMENT_STATUS_FILTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="orders-days" className="text-sm text-gray-500">
                      Periodo
                    </Label>
                    <Select
                      value={searchParams.get('days') ?? String(DEFAULT_DAYS)}
                      onValueChange={(v) => {
                        if (!v) return
                        const p = new URLSearchParams(searchParams)
                        p.set('days', v)
                        p.set('page', '1')
                        setSearchParams(p)
                      }}
                    >
                      <SelectTrigger id="orders-days" className="w-full sm:w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Ultimi 7 giorni</SelectItem>
                        <SelectItem value="30">Ultimi 30 giorni</SelectItem>
                        <SelectItem value="90">Ultimi 90 giorni</SelectItem>
                        <SelectItem value="365">Ultimo anno</SelectItem>
                        <SelectItem value="0">Tutto lo storico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="orders-sort" className="text-sm text-gray-500">
                      Ordinamento
                    </Label>
                    <Select
                      value={sort}
                      onValueChange={(v) => {
                        if (!v) return
                        const p = new URLSearchParams(searchParams)
                        p.set('sort', v)
                        p.set('page', '1')
                        setSearchParams(p)
                      }}
                    >
                      <SelectTrigger id="orders-sort" className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ORDERS_LIST_SORT_LABEL) as OrdersListSort[]).map((k) => (
                          <SelectItem key={k} value={k}>
                            {ORDERS_LIST_SORT_LABEL[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              }
              onReset={hasActiveFilters ? resetFilters : undefined}
              actions={<Button type="submit">Cerca</Button>}
            />
          </form>

          {data != null && items.length > 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              {items.length.toLocaleString('it-IT')} di {data.total.toLocaleString('it-IT')} ordini
              caricati
              {hasMore ? ' · scorri per altri' : ''}
            </p>
          ) : null}

          <div className="table-bleed mt-4">
            <OrdersListTable
              items={[...items]}
              sort={sort}
              loading={orders.listLoading}
              loadingMore={orders.listLoadingMore}
              hasMore={hasMore}
              listReady={data != null}
              sentinelRef={sentinelRef}
              emptyDescription={emptyDescription}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
