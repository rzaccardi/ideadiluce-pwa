import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { RoutePageHeader } from '@/components/route-page-header'
import { InfiniteScrollSentinel, SearchInput, TableFilters, TableSkeleton } from '@/components/shared'
import { fetchOdooPricelistsListDeduped, odooStore } from '@/features/odoo'
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

const PAGE_SIZE = 25

type ActiveFilter = 'all' | 'true' | 'false'

function buildListQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  })
  const q = searchParams.get('q')
  const active = searchParams.get('active')
  if (q) params.set('q', q)
  if (active && active !== 'all') params.set('active', active)
  return params.toString()
}

export function OdooPricelistsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const store = useSnapshot(odooStore)

  const active = (searchParams.get('active') ?? 'all') as ActiveFilter
  const page = Number(searchParams.get('page') ?? '1')
  const listQuery = useMemo(() => buildListQuery(searchParams, page), [searchParams, page])

  const hasMore =
    store.pricelistsList != null &&
    store.pricelistsList.page < store.pricelistsList.totalPages &&
    store.pricelistsListItems.length > 0

  useEffect(() => {
    void fetchOdooPricelistsListDeduped(listQuery, { append: page > 1 })
  }, [listQuery, page])

  const loadMore = useCallback(() => {
    if (store.pricelistsListLoading || store.pricelistsListLoadingMore || !hasMore || !store.pricelistsList) {
      return
    }
    const p = new URLSearchParams(searchParams)
    p.set('page', String(store.pricelistsList.page + 1))
    setSearchParams(p, { replace: true })
  }, [
    hasMore,
    store.pricelistsList,
    store.pricelistsListLoading,
    store.pricelistsListLoadingMore,
    searchParams,
    setSearchParams,
  ])

  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loading: store.pricelistsListLoadingMore,
    onLoadMore: loadMore,
  })

  function setActiveFilter(next: ActiveFilter) {
    const p = new URLSearchParams(searchParams)
    if (next === 'all') p.delete('active')
    else p.set('active', next)
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
          store.pricelistsList != null
            ? `${store.pricelistsList.total} listini Odoo (product.pricelist)`
            : 'Listini prezzi Odoo'
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Elenco listini</CardTitle>
          <CardDescription>Listini attivi e inattivi da Odoo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={applySearch}>
            <TableFilters
              search={
                <SearchInput
                  id="odoo-pricelists-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nome listino…"
                />
              }
              filters={
                <div className="flex flex-col gap-1.5 sm:min-w-[180px]">
                  <Label htmlFor="odoo-pricelists-active">Stato</Label>
                  <Select value={active} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
                    <SelectTrigger id="odoo-pricelists-active" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="true">Attivi</SelectItem>
                      <SelectItem value="false">Inattivi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            />
          </form>

          {store.pricelistsListError ? (
            <Alert variant="destructive">
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{store.pricelistsListError}</AlertDescription>
            </Alert>
          ) : null}

          {store.pricelistsList != null && !store.pricelistsList.configured ? (
            <Alert>
              <AlertTitle>Odoo non configurato</AlertTitle>
              <AlertDescription>
                L&apos;integrazione Odoo non è attiva o mancano le credenziali XML-RPC.
              </AlertDescription>
            </Alert>
          ) : null}

          {store.pricelistsListLoading && store.pricelistsListItems.length === 0 ? (
            <TableSkeleton
              rows={8}
              columns={['Nome', 'Valuta', 'Azienda', 'Regole', 'Stato']}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Valuta</TableHead>
                  <TableHead>Azienda</TableHead>
                  <TableHead className="text-right">Regole</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.pricelistsListItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nessun listino trovato.
                    </TableCell>
                  </TableRow>
                ) : (
                  store.pricelistsListItems.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.currencyCode ?? '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.companyName ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">{row.itemCount}</TableCell>
                      <TableCell>
                        <Badge variant={row.active ? 'default' : 'secondary'}>
                          {row.active ? 'Attivo' : 'Inattivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <InfiniteScrollSentinel ref={sentinelRef} loading={store.pricelistsListLoadingMore} />
        </CardContent>
      </Card>
    </div>
  )
}
