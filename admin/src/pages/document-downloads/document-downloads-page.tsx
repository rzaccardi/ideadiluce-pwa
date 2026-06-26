import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { RoutePageHeader } from '@/components/route-page-header'
import { InfiniteScrollSentinel, SearchInput, TableFilters, TableSkeleton } from '@/components/shared'
import {
  documentDownloadsStore,
  fetchDocumentDownloadsListDeduped,
} from '@/features/document-downloads'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'

const PAGE_SIZE = 25

function buildQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  })
  const q = searchParams.get('q')
  if (q) params.set('q', q)
  return params.toString()
}

export function DocumentDownloadsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const store = useSnapshot(documentDownloadsStore)
  const page = Number(searchParams.get('page') ?? '1')
  const listQuery = useMemo(() => buildQuery(searchParams, page), [searchParams, page])

  const hasMore =
    store.list != null && store.list.page < store.list.totalPages && store.listItems.length > 0

  useEffect(() => {
    void fetchDocumentDownloadsListDeduped(listQuery, { append: page > 1 })
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
    const p = new URLSearchParams()
    if (q.trim()) p.set('q', q.trim())
    p.set('page', '1')
    setSearchParams(p, { replace: true })
  }

  return (
    <div className="space-y-6">
      <RoutePageHeader
        title="Download documenti"
        description={
          store.list != null
            ? `${store.list.total.toLocaleString('it-IT')} download tracciati dal catalogo`
            : 'Schede tecniche e documenti scaricati dalle PDP'
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Ricerca</CardTitle>
          <CardDescription>Filtra per prodotto, nome documento o ID</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={applySearch}>
            <TableFilters
              search={
                <SearchInput
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Slug prodotto, documento…"
                />
              }
            />
          </form>
        </CardContent>
      </Card>

      {store.listError ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.listError}</AlertDescription>
        </Alert>
      ) : null}

      {store.listLoading && store.listItems.length === 0 ? (
        <TableSkeleton rows={8} columns={['Data', 'Prodotto', 'Documento', 'Utente', 'Lingua']} />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Utente</TableHead>
                  <TableHead>Lingua</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.listItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nessun download registrato.
                    </TableCell>
                  </TableRow>
                ) : (
                  store.listItems.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{row.productSlug}</div>
                        {row.variantRef ? (
                          <div className="text-xs text-muted-foreground">Var: {row.variantRef}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div>{row.documentName ?? row.documentId}</div>
                        <div className="text-xs text-muted-foreground">{row.documentId}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.userId ? (
                          <Badge variant="outline">{row.userId.slice(0, 8)}…</Badge>
                        ) : (
                          <span className="text-muted-foreground italic">Anonimo</span>
                        )}
                      </TableCell>
                      <TableCell>{row.locale}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <InfiniteScrollSentinel ref={sentinelRef} hasMore={hasMore} loading={store.listLoadingMore} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
