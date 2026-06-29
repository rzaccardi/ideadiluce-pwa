import { useCallback, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { RoutePageHeader } from '@/components/route-page-header'
import { InfiniteScrollSentinel, RouteSkeleton } from '@/components/shared'
import { fetchWpMigrationRuns, wpMigrationStore } from '@/features/wp-migration'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const PAGE_SIZE = 20

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'complete') return 'default'
  if (status === 'failed') return 'destructive'
  return 'secondary'
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('it-IT')
}

export function SeoMigrationListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const store = useSnapshot(wpMigrationStore)
  const page = Number(searchParams.get('page') ?? '1')
  const listQuery = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
    const status = searchParams.get('status')
    if (status) params.set('status', status)
    return params.toString()
  }, [page, searchParams])

  const hasMore =
    store.runs != null && store.runs.page < store.runs.totalPages && store.runs.items.length > 0

  useEffect(() => {
    void fetchWpMigrationRuns(listQuery, { append: page > 1 })
  }, [listQuery, page])

  const loadMore = useCallback(() => {
    if (store.runsLoading || store.runsLoadingMore || !hasMore || !store.runs) return
    const p = new URLSearchParams(searchParams)
    p.set('page', String(store.runs.page + 1))
    setSearchParams(p, { replace: true })
  }, [hasMore, store.runs, store.runsLoading, store.runsLoadingMore, searchParams, setSearchParams])

  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loading: store.runsLoadingMore,
    onLoadMore: loadMore,
  })

  if (store.runsLoading && !store.runs) {
    return <RouteSkeleton />
  }

  return (
    <div className="space-y-6">
      <RoutePageHeader
        title="Migrazione SEO WordPress"
        description="Storico export inviati dal plugin WordPress: URL, metadati Yoast, prodotti e redirect da mappare sul nuovo sito."
      />

      {store.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Export ricevuti</CardTitle>
          <CardDescription>
            {store.runs ? `${store.runs.total} run totali` : 'Nessun export ancora ricevuto'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!store.runs || store.runs.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Configura il plugin WordPress con URL API e token, poi avvia un export con «Invia al backoffice» attivo.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avviato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Record</TableHead>
                    <TableHead>Sorgente WP</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store.runs.items.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>{formatWhen(run.startedAt)}</TableCell>
                      <TableCell className="font-mono text-xs">{run.exportType}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                      </TableCell>
                      <TableCell>{run.recordCount}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                        {run.sourceUrl ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" render={<Link to={`/seo/migration/${run.id}`} />}>
                          Apri
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <InfiniteScrollSentinel ref={sentinelRef} loading={store.runsLoadingMore} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
