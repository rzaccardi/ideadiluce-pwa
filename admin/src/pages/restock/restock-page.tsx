import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { RoutePageHeader } from '@/components/route-page-header'
import { ClickableTableRow, SearchInput, TableFilters, TableSkeleton } from '@/components/shared'
import { adminRestockStore, fetchAdminRestockListDeduped } from '@/features/restock'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import type { RestockRequestType, StockRestockAdminStatus } from '@/types/restock'
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

const PAGE_SIZE = 25

type NotifyStatusFilter = 'all' | 'pending' | 'notified'

const ADMIN_STATUS_LABELS: Record<StockRestockAdminStatus, string> = {
  NEW: 'Nuova',
  IN_PROGRESS: 'In lavorazione',
  HANDLED: 'Gestita',
  ARCHIVED: 'Archiviata',
}

const REQUEST_TYPE_LABELS: Record<RestockRequestType, string> = {
  RESTOCK_NOTIFY: 'Avvisami restock',
  PRODUCT_REQUEST: 'Richiesta prodotto',
}

function buildListQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    status: searchParams.get('status') ?? 'all',
    requestType: searchParams.get('requestType') ?? 'all',
    adminStatus: searchParams.get('adminStatus') ?? 'all',
  })
  const q = searchParams.get('q')
  if (q) params.set('q', q)
  return params.toString()
}

export function RestockPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const store = useSnapshot(adminRestockStore)

  const notifyStatus = (searchParams.get('status') ?? 'all') as NotifyStatusFilter
  const requestType = (searchParams.get('requestType') ?? 'all') as RestockRequestType | 'all'
  const adminStatus = (searchParams.get('adminStatus') ?? 'all') as StockRestockAdminStatus | 'all'
  const page = Number(searchParams.get('page') ?? '1')

  const listQuery = useMemo(() => buildListQuery(searchParams, page), [searchParams, page])

  const hasMore =
    store.list != null && store.list.page < store.list.totalPages && store.listItems.length > 0

  useEffect(() => {
    void fetchAdminRestockListDeduped(listQuery, { append: page > 1 })
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

  function setFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams)
    p.set(key, value)
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
        title="Richieste prodotto e restock"
        description="Avvisi restock e richieste prodotto fuori stock dalla scheda prodotto PWA"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Elenco richieste</CardTitle>
          <CardDescription>
            Filtra per tipo, stato operativo e notifica cliente. Clicca una riga per il dettaglio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={applySearch}>
            <TableFilters
              search={
                <SearchInput
                  id="restock-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Email o prodotto…"
                />
              }
              filters={
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <div className="flex flex-col gap-1.5 sm:min-w-[160px]">
                    <Label htmlFor="restock-request-type">Tipo</Label>
                    <Select
                      value={requestType}
                      onValueChange={(v) => v && setFilter('requestType', v)}
                    >
                      <SelectTrigger id="restock-request-type" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i tipi</SelectItem>
                        <SelectItem value="RESTOCK_NOTIFY">Avvisami restock</SelectItem>
                        <SelectItem value="PRODUCT_REQUEST">Richiesta prodotto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:min-w-[160px]">
                    <Label htmlFor="restock-admin-status">Stato BO</Label>
                    <Select
                      value={adminStatus}
                      onValueChange={(v) => v && setFilter('adminStatus', v)}
                    >
                      <SelectTrigger id="restock-admin-status" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti</SelectItem>
                        <SelectItem value="NEW">Nuova</SelectItem>
                        <SelectItem value="IN_PROGRESS">In lavorazione</SelectItem>
                        <SelectItem value="HANDLED">Gestita</SelectItem>
                        <SelectItem value="ARCHIVED">Archiviata</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:min-w-[160px]">
                    <Label htmlFor="restock-notify-status">Notifica cliente</Label>
                    <Select
                      value={notifyStatus}
                      onValueChange={(v) => v && setFilter('status', v)}
                    >
                      <SelectTrigger id="restock-notify-status" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutte</SelectItem>
                        <SelectItem value="pending">Non notificato</SelectItem>
                        <SelectItem value="notified">Notificato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              }
            />
          </form>

          {store.listError ? (
            <Alert variant="destructive">
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{store.listError}</AlertDescription>
            </Alert>
          ) : null}

          {store.listLoading && store.listItems.length === 0 ? (
            <TableSkeleton
              rows={8}
              columns={['Aggiornato', 'Tipo', 'Email', 'Prodotto', 'Qtà', 'Stato BO', 'Utente']}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aggiornato</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Prodotto</TableHead>
                  <TableHead className="text-right">Qtà</TableHead>
                  <TableHead>Stato BO</TableHead>
                  <TableHead>Utente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.listItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nessuna richiesta.
                    </TableCell>
                  </TableRow>
                ) : (
                  store.listItems.map((row) => (
                    <ClickableTableRow key={row.id} to={`/restock/${row.id}`}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(row.updatedAt).toLocaleString('it-IT')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{REQUEST_TYPE_LABELS[row.requestType]}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">{row.email}</TableCell>
                      <TableCell className="min-w-0">
                        <p className="truncate font-medium">
                          {row.productName ?? row.productRef}
                        </p>
                        {row.productSlug ? (
                          <p className="truncate text-sm text-muted-foreground">
                            {row.productSlug}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">{row.quantity}</TableCell>
                      <TableCell>{ADMIN_STATUS_LABELS[row.adminStatus]}</TableCell>
                      <TableCell>
                        {row.userEmail ? (
                          <span className="truncate">{row.userEmail}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Guest</span>
                        )}
                      </TableCell>
                    </ClickableTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <div ref={sentinelRef} />
          {store.listLoadingMore ? (
            <p className="text-center text-sm text-muted-foreground">Caricamento…</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
