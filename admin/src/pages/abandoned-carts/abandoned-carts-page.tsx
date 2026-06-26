import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { RoutePageHeader } from '@/components/route-page-header'
import { ClickableTableRow, SearchInput, TableFilters } from '@/components/shared'
import {
  adminAbandonedCartsStore,
  fetchAdminAbandonedCartsListDeduped,
} from '@/features/abandoned-carts'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { ABANDONED_EVENT_LABELS } from '@/types/abandoned-carts'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25
const DEFAULT_DAYS = 90

function buildQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    days: searchParams.get('days') ?? String(DEFAULT_DAYS),
  })
  const q = searchParams.get('q')
  if (q) params.set('q', q)
  return params.toString()
}

export function AbandonedCartsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const store = useSnapshot(adminAbandonedCartsStore)
  const page = Number(searchParams.get('page') ?? '1')
  const listQuery = useMemo(() => buildQuery(searchParams, page), [searchParams, page])

  const hasMore =
    store.list != null && store.list.page < store.list.totalPages && store.listItems.length > 0

  useEffect(() => {
    void fetchAdminAbandonedCartsListDeduped(listQuery, { append: page > 1 })
  }, [listQuery, page])

  const loadMore = useCallback(() => {
    if (store.listLoading || store.listLoadingMore || !hasMore || !store.list) return
    const p = new URLSearchParams(searchParams)
    p.set('page', String(store.list.page + 1))
    setSearchParams(p, { replace: true })
  }, [hasMore, store.list, store.listLoading, store.listLoadingMore, searchParams, setSearchParams])

  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loading: store.listLoadingMore,
    onLoadMore: loadMore,
  })

  function applySearch(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams(searchParams)
    if (q.trim()) p.set('q', q.trim())
    else p.delete('q')
    p.set('page', '1')
    setSearchParams(p)
  }

  return (
    <div className="space-y-6">
      <RoutePageHeader
        description={
          store.list != null
            ? `${store.list.total.toLocaleString('it-IT')} eventi carrello abbandonato`
            : 'Carrelli abbandonati e riserve scadute dalla PWA'
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Carrelli abbandonati</CardTitle>
          <CardDescription>
            Eventi di abbandono checkout, timeout pagamento e scadenza riserva. Apri il dettaglio per
            vedere le righe del carrello.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={applySearch}>
            <TableFilters
              search={
                <SearchInput
                  id="abandoned-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Email o ID carrello…"
                />
              }
              filters={
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="abandoned-days" className="text-sm text-gray-500">
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
                    <SelectTrigger id="abandoned-days" className="w-full sm:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Ultimi 7 giorni</SelectItem>
                      <SelectItem value="30">Ultimi 30 giorni</SelectItem>
                      <SelectItem value="90">Ultimi 90 giorni</SelectItem>
                      <SelectItem value="365">Ultimo anno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
              actions={<Button type="submit">Cerca</Button>}
            />
          </form>

          {store.listError ? (
            <Alert variant="destructive">
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{store.listError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="table-bleed">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Utente</TableHead>
                  <TableHead className="text-right">Righe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.listItems.length === 0 && !store.listLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nessun carrello abbandonato nel periodo.
                    </TableCell>
                  </TableRow>
                ) : (
                  store.listItems.map((row) => (
                    <ClickableTableRow key={row.id} to={`/abandoned-carts/${row.id}`}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(row.createdAt).toLocaleString('it-IT')}
                      </TableCell>
                      <TableCell>
                        {ABANDONED_EVENT_LABELS[row.eventType] ?? row.eventType}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.contactEmail ?? '—'}
                      </TableCell>
                      <TableCell>
                        {row.userId ? (
                          <Link
                            to={`/customers/${row.userId}`}
                            className={cn('text-primary underline-offset-4 hover:underline')}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {row.userEmail ?? row.userId.slice(0, 8)}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground italic">Guest</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.itemCount}</TableCell>
                    </ClickableTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div ref={sentinelRef} />
          {store.listLoadingMore ? (
            <p className="text-center text-sm text-muted-foreground">Caricamento…</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
