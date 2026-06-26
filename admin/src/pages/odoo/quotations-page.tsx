import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { OdooSaleOrderLink } from '@/components/orders/odoo-sale-order-link'
import { RoutePageHeader } from '@/components/route-page-header'
import { ClickableTableRow, InfiniteScrollSentinel, SearchInput, TableFilters, TableSkeleton } from '@/components/shared'
import { fetchOdooQuotationsListDeduped, odooStore } from '@/features/odoo'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { formatDate, formatMoney } from '@/lib/format'
import { quotationStateLabel } from '@/lib/quotation-state'

const PAGE_SIZE = 25

type StateFilter = 'all' | 'draft' | 'sent'

function buildListQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  })
  const q = searchParams.get('q')
  const state = searchParams.get('state')
  if (q) params.set('q', q)
  if (state && state !== 'all') params.set('state', state)
  return params.toString()
}

export function OdooQuotationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const store = useSnapshot(odooStore)

  const state = (searchParams.get('state') ?? 'all') as StateFilter
  const page = Number(searchParams.get('page') ?? '1')
  const listQuery = useMemo(() => buildListQuery(searchParams, page), [searchParams, page])

  const hasMore =
    store.quotationsList != null &&
    store.quotationsList.page < store.quotationsList.totalPages &&
    store.quotationsListItems.length > 0

  useEffect(() => {
    void fetchOdooQuotationsListDeduped(listQuery, { append: page > 1 })
  }, [listQuery, page])

  const loadMore = useCallback(() => {
    if (store.quotationsListLoading || store.quotationsListLoadingMore || !hasMore || !store.quotationsList) {
      return
    }
    const p = new URLSearchParams(searchParams)
    p.set('page', String(store.quotationsList.page + 1))
    setSearchParams(p, { replace: true })
  }, [
    hasMore,
    store.quotationsList,
    store.quotationsListLoading,
    store.quotationsListLoadingMore,
    searchParams,
    setSearchParams,
  ])

  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loading: store.quotationsListLoadingMore,
    onLoadMore: loadMore,
  })

  function setStateFilter(next: StateFilter) {
    const p = new URLSearchParams(searchParams)
    if (next === 'all') p.delete('state')
    else p.set('state', next)
    p.delete('page')
    setSearchParams(p, { replace: true })
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams(searchParams)
    if (q.trim()) p.set('q', q.trim())
    else p.delete('q')
    p.delete('page')
    setSearchParams(p, { replace: true })
  }

  return (
    <div className="space-y-6">
      <RoutePageHeader
        description={
          store.quotationsList != null
            ? `${store.quotationsList.total} preventivi Odoo (bozza/inviato)`
            : 'Preventivi da sale.order Odoo — stati draft e sent'
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Elenco preventivi</CardTitle>
          <CardDescription>
            Ricerca per numero, cliente o email. Apri il dettaglio o vai al documento in Odoo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={applySearch}>
            <TableFilters
              search={
                <SearchInput
                  id="odoo-quotations-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Numero, cliente, email…"
                />
              }
              filters={
                <div className="flex flex-col gap-1.5 sm:min-w-[180px]">
                  <Label htmlFor="odoo-quotations-state">Stato</Label>
                  <Select value={state} onValueChange={(v) => setStateFilter(v as StateFilter)}>
                    <SelectTrigger id="odoo-quotations-state" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="draft">Bozza</SelectItem>
                      <SelectItem value="sent">Inviato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            />
          </form>

          {store.quotationsListError ? (
            <Alert variant="destructive">
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{store.quotationsListError}</AlertDescription>
            </Alert>
          ) : null}

          {store.quotationsList != null && !store.quotationsList.configured ? (
            <Alert>
              <AlertTitle>Odoo non configurato</AlertTitle>
              <AlertDescription>
                L&apos;integrazione Odoo non è attiva o mancano le credenziali XML-RPC.
              </AlertDescription>
            </Alert>
          ) : null}

          {store.quotationsListLoading && store.quotationsListItems.length === 0 ? (
            <TableSkeleton
              rows={8}
              columns={['Numero', 'Cliente', 'Stato', 'Data', 'Totale', 'Odoo']}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead>Odoo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.quotationsListItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nessun preventivo trovato.
                    </TableCell>
                  </TableRow>
                ) : (
                  store.quotationsListItems.map((row) => (
                    <ClickableTableRow key={row.id} to={`/odoo/quotations/${row.id}`}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="min-w-0">
                        <p className="truncate">{row.partnerName ?? '—'}</p>
                        {row.partnerEmail ? (
                          <p className="truncate text-sm text-muted-foreground">{row.partnerEmail}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{quotationStateLabel(row.state)}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(row.dateOrder)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {row.amountTotalCents != null
                          ? formatMoney(row.amountTotalCents, row.currencyCode ?? 'EUR')
                          : '—'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <OdooSaleOrderLink saleOrderId={row.id} />
                      </TableCell>
                    </ClickableTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <InfiniteScrollSentinel ref={sentinelRef} loading={store.quotationsListLoadingMore} />
        </CardContent>
      </Card>
    </div>
  )
}
