import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { RoutePageHeader } from '@/components/route-page-header'
import { InfiniteScrollSentinel, TableFilters } from '@/components/shared'
import {
  fetchIntegrationLogsListDeduped,
  integrationLogsStore,
} from '@/features/integration-logs'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from '@/components/shared/table-skeleton'

const PAGE_SIZE = 25

function buildQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  })
  const service = searchParams.get('service')
  const success = searchParams.get('success')
  if (service) params.set('service', service)
  if (success) params.set('success', success)
  return params.toString()
}

export function IntegrationLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const store = useSnapshot(integrationLogsStore)
  const page = Number(searchParams.get('page') ?? '1')
  const listQuery = useMemo(() => buildQuery(searchParams, page), [searchParams, page])
  const [serviceFilter, setServiceFilter] = useState(searchParams.get('service') ?? '')
  const [successFilter, setSuccessFilter] = useState(searchParams.get('success') ?? '')

  const hasMore =
    store.list != null && store.list.page < store.list.totalPages && store.listItems.length > 0

  useEffect(() => {
    void fetchIntegrationLogsListDeduped(listQuery, { append: page > 1 })
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

  function applyFilters(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (serviceFilter.trim()) p.set('service', serviceFilter.trim())
    if (successFilter) p.set('success', successFilter)
    p.set('page', '1')
    setSearchParams(p)
  }

  return (
    <div className="space-y-6">
      <RoutePageHeader
        title="Log integrazioni"
        description={
          store.list != null
            ? `${store.list.total} eventi registrati`
            : 'Chiamate verso Odoo, VIES e servizi esterni'
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>Filtra per servizio e esito</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={applyFilters}>
            <TableFilters
              filters={
                <div className="grid w-full gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="service-filter">Servizio</Label>
                    <Select
                      value={serviceFilter || 'all'}
                      onValueChange={(v) => setServiceFilter(!v || v === 'all' ? '' : v)}
                    >
                      <SelectTrigger id="service-filter" className="h-10 w-full">
                        <SelectValue placeholder="Tutti" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti</SelectItem>
                        <SelectItem value="odoo">odoo</SelectItem>
                        <SelectItem value="vies">vies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="success-filter">Esito</Label>
                    <Select
                      value={successFilter || 'all'}
                      onValueChange={(v) => setSuccessFilter(!v || v === 'all' ? '' : v)}
                    >
                      <SelectTrigger id="success-filter" className="h-10 w-full">
                        <SelectValue placeholder="Tutti" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti</SelectItem>
                        <SelectItem value="true">OK</SelectItem>
                        <SelectItem value="false">Errore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              }
              actions={<Button type="submit">Applica</Button>}
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

      <Card>
        <CardHeader>
          <CardTitle>Eventi recenti</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          {store.listLoading && store.listItems.length === 0 ? (
            <TableSkeleton columns={['Data', 'Servizio', 'Operazione', 'Esito', 'HTTP', 'Durata']} rows={8} />
          ) : null}
          {!store.listLoading || store.listItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Servizio</TableHead>
                  <TableHead>Operazione</TableHead>
                  <TableHead>Esito</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead>Durata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.listItems.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(row.startedAt).toLocaleString('it-IT')}
                    </TableCell>
                    <TableCell>{row.service}</TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-xs">{row.operation}</TableCell>
                    <TableCell>
                      <Badge variant={row.success ? 'default' : 'destructive'}>
                        {row.success ? 'OK' : 'Errore'}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.statusCode ?? '—'}</TableCell>
                    <TableCell>{row.durationMs != null ? `${row.durationMs} ms` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
          <InfiniteScrollSentinel ref={sentinelRef} loading={store.listLoadingMore} />
        </CardContent>
      </Card>
    </div>
  )
}
