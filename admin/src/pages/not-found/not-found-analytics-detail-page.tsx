import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { ArrowLeftIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchNotFoundPathDetailDeduped,
  notFoundAnalyticsStore,
  resetNotFoundAnalyticsDetail,
} from '@/features/not-found'
import { upsertSeoRedirect } from '@/features/seo'
import {
  DetailField,
  DetailPageActionBar,
  DetailValue,
  EmptyState,
  InfiniteScrollSentinel,
  RouteSkeleton,
  SitePageHeader,
  TableSkeleton,
} from '@/components/shared'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { formatDateTime } from '@/lib/format'
import {
  NOT_FOUND_PATH_KIND_LABELS,
  NOT_FOUND_REFERRER_KIND_LABELS,
} from '@/types/not-found'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

function referrerDisplay(referrer: string | null, kind: string) {
  if (!referrer || kind === 'none') return 'Accesso diretto / senza referrer'
  return referrer
}

export function NotFoundAnalyticsDetailPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const store = useSnapshot(notFoundAnalyticsStore)
  const path = searchParams.get('path') ?? ''
  const days = searchParams.get('days') ?? String(DEFAULT_DAYS)
  const hideBots = boolParam(searchParams.get('hideBots'), false)
  const hideProbes = boolParam(searchParams.get('hideProbes'), true)
  const page = Number(searchParams.get('page') ?? '1')
  const [toPath, setToPath] = useState('')
  const [reason, setReason] = useState('Link perso da analytics 404')
  const [saving, setSaving] = useState(false)

  const hitsQuery = useMemo(() => {
    const params = new URLSearchParams({
      path,
      page: String(page),
      pageSize: String(PAGE_SIZE),
      days,
      hideBots: String(hideBots),
      hideProbes: String(hideProbes),
    })
    return params.toString()
  }, [path, page, days, hideBots, hideProbes])

  const hasMore =
    store.detail != null && store.detail.page < store.detail.totalPages && store.detailItems.length > 0

  useEffect(() => {
    if (!path) return
    void fetchNotFoundPathDetailDeduped(hitsQuery, { append: page > 1 })
  }, [hitsQuery, page, path])

  useEffect(() => {
    return () => {
      resetNotFoundAnalyticsDetail()
    }
  }, [])

  const loadMore = useCallback(() => {
    if (store.detailLoading || store.detailLoadingMore || !hasMore || !store.detail) return
    const p = new URLSearchParams(searchParams)
    p.set('page', String(store.detail.page + 1))
    setSearchParams(p, { replace: true })
  }, [
    hasMore,
    store.detail,
    store.detailLoading,
    store.detailLoadingMore,
    searchParams,
    setSearchParams,
  ])

  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loading: store.detailLoadingMore,
    onLoadMore: loadMore,
  })

  async function onCreateRedirect(e: React.FormEvent) {
    e.preventDefault()
    if (!path.trim() || !toPath.trim()) return
    setSaving(true)
    try {
      await upsertSeoRedirect({
        fromPath: path.trim(),
        toPath: toPath.trim(),
        statusCode: 301,
        reason: reason.trim() || null,
      })
      toast.success('Redirect 301 salvato')
      setToPath('')
      void fetchNotFoundPathDetailDeduped(hitsQuery)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Salvataggio fallito')
    } finally {
      setSaving(false)
    }
  }

  if (!path) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio 404" />
        <Alert variant="destructive">
          <AlertTitle>Path mancante</AlertTitle>
          <AlertDescription>Apri un URL dalla lista delle pagine 404.</AlertDescription>
        </Alert>
        <Button variant="outline" render={<Link to="/not-found" />}>
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Torna all&apos;elenco
        </Button>
      </div>
    )
  }

  if (store.detailLoading && store.detailItems.length === 0 && !store.detailError) {
    return (
      <div className="space-y-6">
        <SitePageHeader title={path} />
        <RouteSkeleton variant="detail" />
      </div>
    )
  }

  if (store.detailError && !store.detail) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio 404" />
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.detailError}</AlertDescription>
        </Alert>
        <Button variant="outline" render={<Link to="/not-found" />}>
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Torna all&apos;elenco
        </Button>
      </div>
    )
  }

  const detail = store.detail

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SitePageHeader
          title={path}
          description={`${detail ? detail.hits.toLocaleString('it-IT') : '—'} visualizzazioni · ${NOT_FOUND_PATH_KIND_LABELS[detail?.pathKind ?? ''] ?? detail?.pathKind ?? ''}`}
        />
        <DetailPageActionBar
          secondary={
            <Button variant="outline" className="w-full lg:w-auto" render={<Link to="/not-found" />}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Elenco 404
            </Button>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sintesi</CardTitle>
            <CardDescription>Chi arriva su questo URL inesistente</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Path">
              <DetailValue className="break-all font-mono text-sm">{path}</DetailValue>
            </DetailField>
            <DetailField label="Tipo">
              <DetailValue>
                {NOT_FOUND_PATH_KIND_LABELS[detail?.pathKind ?? ''] ?? detail?.pathKind ?? '-'}
              </DetailValue>
            </DetailField>
            <DetailField label="Visualizzazioni">
              <DetailValue>{detail?.hits.toLocaleString('it-IT') ?? '-'}</DetailValue>
            </DetailField>
            <DetailField label="Redirect SEO">
              {detail?.redirect ? (
                <Badge variant="outline" className="border-emerald-300 text-emerald-800">
                  {detail.redirect.statusCode} → {detail.redirect.toPath}
                </Badge>
              ) : (
                <DetailValue empty>-</DetailValue>
              )}
            </DetailField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crea redirect 301</CardTitle>
            <CardDescription>
              Se l’URL è un link perso, punta alla pagina corretta. Il middleware PWA lo applicherà subito.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void onCreateRedirect(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nf-from">Da</Label>
                <Input id="nf-from" value={path} readOnly className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nf-to">A (path)</Label>
                <Input
                  id="nf-to"
                  value={toPath}
                  onChange={(e) => setToPath(e.target.value)}
                  placeholder="/prodotto/nuovo-slug"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nf-reason">Motivo</Label>
                <Input id="nf-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="success" disabled={saving || !toPath.trim()}>
                  {saving ? 'Salvataggio…' : 'Salva redirect'}
                </Button>
                <Button variant="outline" render={<Link to="/seo" />}>
                  Apri SEO e feed
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referrer</CardTitle>
          <CardDescription>
            Pagine o siti da cui arrivano i visitatori. I link interni sono i candidati più forti di link persi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!detail || detail.referrers.length === 0 ? (
            <EmptyState title="Nessun referrer" description="Gli accessi sono diretti, da bookmark o senza header Referer." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origine</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Hit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.referrers.map((row, index) => (
                  <TableRow key={`${row.referrer ?? 'none'}-${index}`}>
                    <TableCell className="max-w-[420px] truncate font-mono text-sm">
                      {referrerDisplay(row.referrer, row.referrerKind)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {NOT_FOUND_REFERRER_KIND_LABELS[row.referrerKind] ?? row.referrerKind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hit recenti</CardTitle>
          <CardDescription>Singole visualizzazioni della pagina 404</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {store.detailLoading && store.detailItems.length === 0 ? (
            <TableSkeleton rows={6} columns={['Data', 'Referrer', 'Locale', 'Bot']} />
          ) : store.detailItems.length === 0 ? (
            <EmptyState title="Nessun hit" description="Nessuna visualizzazione nel periodo filtrato." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Locale</TableHead>
                  <TableHead>Query</TableHead>
                  <TableHead>Bot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.detailItems.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm">
                      {row.referrer ?? <span className="italic text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>{row.locale}</TableCell>
                    <TableCell className="max-w-[160px] truncate font-mono text-xs text-muted-foreground">
                      {row.queryString ?? <span className="italic text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>{row.isBot ? 'Sì' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <InfiniteScrollSentinel ref={sentinelRef} loading={store.detailLoadingMore} />
        </CardContent>
      </Card>
    </div>
  )
}
