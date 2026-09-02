import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { UnlinkIcon } from 'lucide-react'
import { RoutePageHeader } from '@/components/route-page-header'
import { KpiStatCard } from '@/components/kpi-stat-card'
import {
  ClickableTableRow,
  EmptyState,
  InfiniteScrollSentinel,
  SearchInput,
  TableFilters,
  TableSkeleton,
} from '@/components/shared'
import {
  fetchNotFoundPathsDeduped,
  fetchNotFoundStatsDeduped,
  notFoundAnalyticsStore,
} from '@/features/not-found'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { formatDateTime } from '@/lib/format'
import {
  NOT_FOUND_PATH_KIND_FILTER_OPTIONS,
  NOT_FOUND_PATH_KIND_LABELS,
  NOT_FOUND_REFERRER_KIND_FILTER_OPTIONS,
  NOT_FOUND_REFERRER_KIND_LABELS,
} from '@/types/not-found'
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
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 25
const DEFAULT_DAYS = 30

function boolParam(value: string | null, fallback: boolean) {
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return fallback
}

function buildListQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    days: searchParams.get('days') ?? String(DEFAULT_DAYS),
    hideBots: String(boolParam(searchParams.get('hideBots'), false)),
    hideProbes: String(boolParam(searchParams.get('hideProbes'), true)),
    referrerKind: searchParams.get('referrerKind') ?? 'all',
    pathKind: searchParams.get('pathKind') ?? 'all',
  })
  const q = searchParams.get('q')
  if (q) params.set('q', q)
  return params.toString()
}

function buildStatsQuery(searchParams: URLSearchParams) {
  const params = new URLSearchParams({
    days: searchParams.get('days') ?? String(DEFAULT_DAYS),
    hideBots: String(boolParam(searchParams.get('hideBots'), false)),
    hideProbes: String(boolParam(searchParams.get('hideProbes'), true)),
  })
  return params.toString()
}

function topReferrerLabel(referrer: string | null, kind: string) {
  if (!referrer || kind === 'none') return 'Accesso diretto'
  try {
    const url = new URL(referrer)
    if (kind === 'internal') return url.pathname || '/'
    return url.hostname.replace(/^www\./, '')
  } catch {
    return referrer
  }
}

function pathKindLabel(kind: string) {
  return NOT_FOUND_PATH_KIND_LABELS[kind] ?? kind
}

export function NotFoundAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const store = useSnapshot(notFoundAnalyticsStore)
  const page = Number(searchParams.get('page') ?? '1')
  const days = searchParams.get('days') ?? String(DEFAULT_DAYS)
  const pathKind = searchParams.get('pathKind') ?? 'all'
  const referrerKind = searchParams.get('referrerKind') ?? 'all'
  const hideBots = boolParam(searchParams.get('hideBots'), false)
  const hideProbes = boolParam(searchParams.get('hideProbes'), true)

  const listQuery = useMemo(() => buildListQuery(searchParams, page), [searchParams, page])
  const statsQuery = useMemo(() => buildStatsQuery(searchParams), [searchParams])

  const hasMore =
    store.list != null && store.list.page < store.list.totalPages && store.listItems.length > 0

  useEffect(() => {
    void fetchNotFoundStatsDeduped(statsQuery)
  }, [statsQuery])

  useEffect(() => {
    void fetchNotFoundPathsDeduped(listQuery, { append: page > 1 })
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

  function patchParams(next: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(next)) {
      if (value == null || value === '') p.delete(key)
      else p.set(key, value)
    }
    p.set('page', '1')
    setSearchParams(p)
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault()
    patchParams({ q: q.trim() || null })
  }

  const stats = store.stats
  const dailyMax = stats?.maxDaily ?? 1
  const topMax = stats?.topPaths[0]?.hits ?? 1

  return (
    <div className="space-y-6">
      <RoutePageHeader description="URL della pagina 404 vista in negozio, con referrer per capire se è un link perso" />

      <Card>
        <CardHeader>
          <CardTitle>Periodo e filtri</CardTitle>
          <CardDescription>
            Le visualizzazioni partono dalla pagina 404 della PWA. I probe (wp-admin, .php) sono nascosti di
            default.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Ultimi giorni</Label>
            <Select value={days} onValueChange={(v) => v && patchParams({ days: v })}>
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
          <div className="flex items-center gap-3 pb-1">
            <Switch
              id="nf-hide-bots"
              checked={hideBots}
              onCheckedChange={(checked) => patchParams({ hideBots: String(checked) })}
            />
            <Label htmlFor="nf-hide-bots" className="font-normal">
              Nascondi bot
            </Label>
          </div>
          <div className="flex items-center gap-3 pb-1">
            <Switch
              id="nf-hide-probes"
              checked={hideProbes}
              onCheckedChange={(checked) => patchParams({ hideProbes: String(checked) })}
            />
            <Label htmlFor="nf-hide-probes" className="font-normal">
              Nascondi probe
            </Label>
          </div>
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
            <KpiStatCard label="Visualizzazioni 404" value={stats.totalHits.toLocaleString('it-IT')} />
            <KpiStatCard label="URL unici" value={stats.uniquePaths.toLocaleString('it-IT')} />
            <KpiStatCard
              label="Con referrer"
              value={stats.withReferrerHits.toLocaleString('it-IT')}
              valueClassName={stats.withReferrerHits > 0 ? 'text-amber-700' : undefined}
            />
            <KpiStatCard
              label="Link interni persi"
              value={stats.internalHits.toLocaleString('it-IT')}
              valueClassName={stats.internalHits > 0 ? 'text-amber-700' : undefined}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trend giornaliero</CardTitle>
                <CardDescription>Volume di pagine 404 nel periodo</CardDescription>
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
                        <span className="truncate text-[9px] text-gray-400">{row.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Origine del traffico</CardTitle>
                <CardDescription>Da dove arrivano le 404</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.byReferrerKind.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nessun dato nel periodo.</p>
                ) : (
                  stats.byReferrerKind.map((row) => (
                    <div key={row.referrerKind} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{NOT_FOUND_REFERRER_KIND_LABELS[row.referrerKind] ?? row.referrerKind}</span>
                        <span className="font-medium tabular-nums">{row.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-gray-800"
                          style={{
                            width: `${Math.round((row.count / Math.max(stats.totalHits, 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>URL più visti</CardTitle>
              <CardDescription>Pagine 404 con più visualizzazioni nel periodo</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topPaths.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun URL nel periodo.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Hit</TableHead>
                      <TableHead>Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topPaths.map((row) => (
                      <TableRow key={row.path}>
                        <TableCell className="max-w-[320px] truncate font-mono text-sm">{row.path}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{pathKindLabel(row.pathKind)}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.hits}</TableCell>
                        <TableCell>
                          <div className="h-2 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-amber-600"
                              style={{ width: `${Math.round((row.hits / topMax) * 100)}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>URL in 404</CardTitle>
          <CardDescription>
            {store.list != null
              ? `${store.list.total.toLocaleString('it-IT')} path unici nel periodo`
              : 'Apri il dettaglio per vedere i referrer e creare un redirect'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={applySearch}>
            <TableFilters
              search={
                <SearchInput
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filtra per path o referrer…"
                />
              }
              filters={
                <>
                  <div className="space-y-2">
                    <Label className="sr-only">Tipo URL</Label>
                    <Select
                      value={pathKind}
                      onValueChange={(v) => {
                        if (!v) return
                        patchParams({
                          pathKind: v,
                          ...(v === 'probe' ? { hideProbes: 'false' } : {}),
                        })
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOT_FOUND_PATH_KIND_FILTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="sr-only">Referrer</Label>
                    <Select
                      value={referrerKind}
                      onValueChange={(v) => v && patchParams({ referrerKind: v })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOT_FOUND_REFERRER_KIND_FILTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              }
              onReset={() => {
                setQ('')
                setSearchParams(new URLSearchParams({ days }))
              }}
            />
          </form>

          {store.listError ? (
            <Alert variant="destructive">
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{store.listError}</AlertDescription>
            </Alert>
          ) : null}

          {store.listLoading && store.listItems.length === 0 ? (
            <TableSkeleton rows={8} columns={['Path', 'Tipo', 'Hit', 'Referrer', 'Ultimo']} />
          ) : store.listItems.length === 0 ? (
            <EmptyState
              icon={UnlinkIcon}
              title="Nessuna pagina 404 nel periodo"
              description="Quando un visitatore vede la pagina «non trovata» in negozio, l’URL comparirà qui con il referrer."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Hit</TableHead>
                  <TableHead>Referrer principale</TableHead>
                  <TableHead>Redirect</TableHead>
                  <TableHead>Ultimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.listItems.map((row) => {
                  const top = row.topReferrers[0]
                  return (
                    <ClickableTableRow
                      key={row.path}
                      to={`/not-found/detail?path=${encodeURIComponent(row.path)}&days=${days}&hideBots=${hideBots}&hideProbes=${hideProbes}`}
                    >
                      <TableCell className="max-w-[280px] truncate font-mono text-sm font-medium">
                        {row.path}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pathKindLabel(row.pathKind)}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.hits}
                        {row.internalHits > 0 ? (
                          <span className="ml-1 text-xs text-amber-700">· {row.internalHits} interni</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                        {top
                          ? topReferrerLabel(top.referrer, top.referrerKind)
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {row.redirect ? (
                          <Badge variant="outline" className="border-emerald-300 text-emerald-800">
                            {row.redirect.statusCode} → {row.redirect.toPath}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(row.lastSeenAt)}
                      </TableCell>
                    </ClickableTableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <InfiniteScrollSentinel ref={sentinelRef} loading={store.listLoadingMore} />
        </CardContent>
      </Card>
    </div>
  )
}
