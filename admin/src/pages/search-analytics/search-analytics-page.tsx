import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { RefreshCwIcon } from 'lucide-react'
import { RoutePageHeader } from '@/components/route-page-header'
import { KpiStatCard } from '@/components/kpi-stat-card'
import { InfiniteScrollSentinel, SearchInput, TableFilters, TableSkeleton } from '@/components/shared'
import {
  applyOdooSearchHints,
  fetchSearchAnalyticsListDeduped,
  fetchSearchAnalyticsStatsDeduped,
  previewOdooSearchHints,
  searchAnalyticsStore,
} from '@/features/search-analytics'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { formatDateTime } from '@/lib/format'
import { SEARCH_ACTION_LABELS, SEARCH_SOURCE_LABELS } from '@/types/search-analytics'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PAGE_SIZE = 25
const DEFAULT_DAYS = 30
const DEFAULT_ODOO_LOOKBACK_DAYS = 90
const DEFAULT_ODOO_HINT_LIMIT = 8

function buildListQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    days: searchParams.get('days') ?? String(DEFAULT_DAYS),
  })
  const q = searchParams.get('q')
  if (q) params.set('q', q)
  const locale = searchParams.get('locale')
  if (locale) params.set('locale', locale)
  const source = searchParams.get('source')
  if (source) params.set('source', source)
  return params.toString()
}

function buildStatsQuery(searchParams: URLSearchParams) {
  const params = new URLSearchParams({
    days: searchParams.get('days') ?? String(DEFAULT_DAYS),
  })
  const locale = searchParams.get('locale')
  if (locale) params.set('locale', locale)
  return params.toString()
}

function sourceLabel(source: string) {
  return SEARCH_SOURCE_LABELS[source] ?? source
}

function actionLabel(action: string) {
  return SEARCH_ACTION_LABELS[action] ?? action
}

export function SearchAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [odooLookbackDays, setOdooLookbackDays] = useState(String(DEFAULT_ODOO_LOOKBACK_DAYS))
  const [odooHintLimit, setOdooHintLimit] = useState(String(DEFAULT_ODOO_HINT_LIMIT))
  const store = useSnapshot(searchAnalyticsStore)
  const page = Number(searchParams.get('page') ?? '1')
  const days = searchParams.get('days') ?? String(DEFAULT_DAYS)

  const listQuery = useMemo(() => buildListQuery(searchParams, page), [searchParams, page])
  const statsQuery = useMemo(() => buildStatsQuery(searchParams), [searchParams])

  const hasMore =
    store.list != null && store.list.page < store.list.totalPages && store.listItems.length > 0

  useEffect(() => {
    void fetchSearchAnalyticsStatsDeduped(statsQuery)
  }, [statsQuery])

  useEffect(() => {
    void previewOdooSearchHints(
      Number(odooLookbackDays) || DEFAULT_ODOO_LOOKBACK_DAYS,
      Number(odooHintLimit) || DEFAULT_ODOO_HINT_LIMIT,
    ).catch(() => undefined)
  }, [])

  useEffect(() => {
    void fetchSearchAnalyticsListDeduped(listQuery, { append: page > 1 })
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

  function setDays(next: string) {
    const p = new URLSearchParams(searchParams)
    p.set('days', next)
    p.set('page', '1')
    setSearchParams(p)
  }

  async function handlePreviewOdooHints() {
    await previewOdooSearchHints(Number(odooLookbackDays) || DEFAULT_ODOO_LOOKBACK_DAYS, Number(odooHintLimit) || DEFAULT_ODOO_HINT_LIMIT)
  }

  async function handleApplyOdooHints() {
    await applyOdooSearchHints(Number(odooLookbackDays) || DEFAULT_ODOO_LOOKBACK_DAYS, Number(odooHintLimit) || DEFAULT_ODOO_HINT_LIMIT)
  }

  const stats = store.stats
  const topMax = stats?.topQueries[0]?.count ?? 1
  const dailyMax = stats?.maxDaily ?? 1

  return (
    <div className="space-y-6">
      <RoutePageHeader
        title="Analytics ricerca"
        description="Query di ricerca catalogo, trend e zero risultati per analisi di mercato"
      />

      <Card>
        <CardHeader>
          <CardTitle>Periodo</CardTitle>
          <CardDescription>Filtra metriche e log eventi</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Ultimi giorni</Label>
            <Select value={days} onValueChange={(v) => v && setDays(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 giorni</SelectItem>
                <SelectItem value="30">30 giorni</SelectItem>
                <SelectItem value="90">90 giorni</SelectItem>
                <SelectItem value="180">180 giorni</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Query consigliate onsite</CardTitle>
          <CardDescription>
            Importa da Odoo i prodotti più acquistati e salvali come suggerimenti nella ricerca Home (tutte le lingue).
            Il backend aggiorna automaticamente ogni {store.odooHints?.staleHours ?? 72} ore se Odoo è configurato.
            {' '}
            <Link to="/site/home" className="font-medium text-gray-900 underline-offset-2 hover:underline">
              Modifica manualmente in Pagine sito →
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {store.odooHints ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                Ultimo sync Odoo:{' '}
                {store.odooHints.lastOdooSyncedAt
                  ? formatDateTime(store.odooHints.lastOdooSyncedAt)
                  : 'mai'}
              </span>
              {store.odooHints.isStale ? (
                <Badge variant="outline" className="border-amber-300 text-amber-800">
                  Da aggiornare
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-300 text-emerald-800">
                  Aggiornato
                </Badge>
              )}
              {!store.odooHints.autoSyncEnabled ? (
                <Badge variant="outline">Auto-sync disattivato</Badge>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Periodo vendite Odoo</Label>
              <Select value={odooLookbackDays} onValueChange={(v) => v && setOdooLookbackDays(v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 giorni</SelectItem>
                  <SelectItem value="90">90 giorni</SelectItem>
                  <SelectItem value="180">180 giorni</SelectItem>
                  <SelectItem value="365">365 giorni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="odoo-hint-limit">N. query</Label>
              <Input
                id="odoo-hint-limit"
                type="number"
                min={1}
                max={20}
                className="w-[100px]"
                value={odooHintLimit}
                onChange={(e) => setOdooHintLimit(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={store.odooHintsLoading || store.odooHintsApplying}
              onClick={() => void handlePreviewOdooHints()}
            >
              <RefreshCwIcon className={store.odooHintsLoading ? 'size-4 animate-spin' : 'size-4'} />
              Anteprima da Odoo
            </Button>
            <Button
              type="button"
              variant="success"
              disabled={store.odooHintsLoading || store.odooHintsApplying}
              onClick={() => void handleApplyOdooHints()}
            >
              Salva in Home
            </Button>
          </div>

          {store.odooHintsError ? (
            <Alert variant="destructive">
              <AlertTitle>Errore import Odoo</AlertTitle>
              <AlertDescription>{store.odooHintsError}</AlertDescription>
            </Alert>
          ) : null}

          {store.odooHintsMessage ? (
            <Alert>
              <AlertTitle>Query aggiornate</AlertTitle>
              <AlertDescription>{store.odooHintsMessage}</AlertDescription>
            </Alert>
          ) : null}

          {store.odooHints?.currentHints.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Query attuali in Home (IT)</p>
              <div className="flex flex-wrap gap-2">
                {store.odooHints.currentHints.map((hint) => (
                  <Badge key={hint} variant="outline" className="font-mono font-normal">
                    {hint}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {store.odooHints?.suggestions.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query suggerita</TableHead>
                  <TableHead>Prodotto Odoo</TableHead>
                  <TableHead className="text-right">Pezzi venduti</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.odooHints.suggestions.map((row) => (
                  <TableRow key={row.productTemplateId}>
                    <TableCell className="font-mono text-sm font-medium">{row.query}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                      {row.productName}
                      {row.defaultCode ? ` · ${row.defaultCode}` : ''}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.totalQuantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : store.odooHintsLoading ? (
            <TableSkeleton rows={4} columns={['Query', 'Prodotto', 'Pezzi']} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Carica un’anteprima per vedere i prodotti più acquistati e le query proposte.
            </p>
          )}
        </CardContent>
      </Card>

      {store.statsError ? (
        <Alert variant="destructive">
          <AlertTitle>Errore statistiche</AlertTitle>
          <AlertDescription>{store.statsError}</AlertDescription>
        </Alert>
      ) : null}

      {store.statsLoading && !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiStatCard label="Eventi totali" value={stats.totalEvents.toLocaleString('it-IT')} />
            <KpiStatCard label="Query uniche" value={stats.uniqueQueries.toLocaleString('it-IT')} />
            <KpiStatCard
              label="Zero risultati"
              value={`${stats.zeroResultRate}%`}
              valueClassName={stats.zeroResultRate > 20 ? 'text-amber-700' : undefined}
            />
            <KpiStatCard label="Click suggerimenti" value={`${stats.pickThroughRate}%`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trend giornaliero</CardTitle>
                <CardDescription>Volume ricerche nel periodo</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.dailyTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessun dato nel periodo.</p>
                ) : (
                  <div className="flex h-40 items-end gap-1">
                    {stats.dailyTrend.map((row) => (
                      <div key={row.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t bg-gray-800/85 transition-all"
                          style={{ height: `${Math.max(8, (row.count / dailyMax) * 100)}%` }}
                          title={`${row.date}: ${row.count}`}
                        />
                        <span className="truncate text-[9px] text-gray-400">
                          {row.date.slice(5)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Per punto di ingresso</CardTitle>
                <CardDescription>Da dove parte la ricerca</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.bySource.map((row) => (
                  <div key={row.source} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{sourceLabel(row.source)}</span>
                      <span className="font-medium tabular-nums">{row.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-gray-800"
                        style={{
                          width: `${Math.round((row.count / stats.totalEvents) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top query</CardTitle>
              <CardDescription>Termini più cercati (con zero risultati nel periodo)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead className="text-right">Ricerche</TableHead>
                    <TableHead className="text-right">Zero risultati</TableHead>
                    <TableHead>Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topQueries.map((row) => (
                    <TableRow key={row.normalizedQuery}>
                      <TableCell className="font-medium">{row.query}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.zeroResults}</TableCell>
                      <TableCell>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-amber-600"
                            style={{ width: `${Math.round((row.count / topMax) * 100)}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Log eventi</CardTitle>
          <CardDescription>
            {store.list != null
              ? `${store.list.total.toLocaleString('it-IT')} eventi nel periodo`
              : 'Ricerche e click sui suggerimenti'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={applySearch}>
            <TableFilters
              search={
                <SearchInput
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filtra per query…"
                />
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
            <TableSkeleton rows={8} columns={['Data', 'Query', 'Azione', 'Fonte', 'Risultati']} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Query</TableHead>
                  <TableHead>Azione</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Risultati</TableHead>
                  <TableHead>Click</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.listItems.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">{row.query}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{actionLabel(row.action)}</Badge>
                    </TableCell>
                    <TableCell>{sourceLabel(row.source)}</TableCell>
                    <TableCell className="tabular-nums">
                      {row.productTotal ?? row.resultCount ?? '—'}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                      {row.clickedLabel ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <InfiniteScrollSentinel ref={sentinelRef} loading={store.listLoadingMore} />
        </CardContent>
      </Card>
    </div>
  )
}
