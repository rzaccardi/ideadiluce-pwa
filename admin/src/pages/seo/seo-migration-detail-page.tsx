import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { RoutePageHeader } from '@/components/route-page-header'
import { InfiniteScrollSentinel, RouteSkeleton } from '@/components/shared'
import {
  fetchWpMigrationRecords,
  fetchWpMigrationRun,
  patchWpMigrationRecord,
  wpMigrationStore,
  type WpMigrationRecord,
} from '@/features/wp-migration'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

const PAGE_SIZE = 50

export function SeoMigrationDetailPage() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const store = useSnapshot(wpMigrationStore)
  const page = Number(searchParams.get('page') ?? '1')
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nextjsTargetUrl, setNextjsTargetUrl] = useState('')
  const [seoPriority, setSeoPriority] = useState('')
  const [notes, setNotes] = useState('')

  const listQuery = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
    const recordType = searchParams.get('recordType')
    const query = searchParams.get('q')
    if (recordType) params.set('recordType', recordType)
    if (query) params.set('q', query)
    return params.toString()
  }, [page, searchParams])

  const hasMore =
    store.records != null && store.records.page < store.records.totalPages && store.records.items.length > 0

  useEffect(() => {
    if (!id) return
    void fetchWpMigrationRun(id)
  }, [id])

  useEffect(() => {
    if (!id) return
    void fetchWpMigrationRecords(id, listQuery, { append: page > 1 })
  }, [id, listQuery, page])

  const loadMore = useCallback(() => {
    if (store.recordsLoading || store.recordsLoadingMore || !hasMore || !store.records) return
    const p = new URLSearchParams(searchParams)
    p.set('page', String(store.records.page + 1))
    setSearchParams(p, { replace: true })
  }, [hasMore, store.records, store.recordsLoading, store.recordsLoadingMore, searchParams, setSearchParams])

  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loading: store.recordsLoadingMore,
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

  function startEdit(recordId: string, record: WpMigrationRecord) {
    setEditingId(recordId)
    setNextjsTargetUrl(record.nextjsTargetUrl ?? '')
    setSeoPriority(record.seoPriority ?? '')
    setNotes(record.notes ?? '')
  }

  async function saveEdit(recordId: string) {
    try {
      await patchWpMigrationRecord(id, recordId, {
        nextjsTargetUrl: nextjsTargetUrl.trim() || null,
        seoPriority: seoPriority.trim() || null,
        notes: notes.trim() || null,
      })
      toast.success('Record aggiornato')
      setEditingId(null)
      await fetchWpMigrationRecords(id, listQuery)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Salvataggio fallito')
    }
  }

  if ((store.recordsLoading && !store.records) || !store.runDetail) {
    return <RouteSkeleton />
  }

  const run = store.runDetail

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" render={<Link to="/seo/migration" />}>
          ← Storico migrazioni
        </Button>
        <RoutePageHeader
          title={`Export ${run.exportType}`}
          description={`${run.recordCount} record · ${run.sourceUrl ?? 'WordPress'}`}
        />
      </div>

      {store.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Stato run</CardTitle>
          <CardDescription>{run.message ?? '—'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <p><span className="text-muted-foreground">Stato:</span> <Badge>{run.status}</Badge></p>
          <p><span className="text-muted-foreground">Fase:</span> {run.phase ?? '—'}</p>
          <p><span className="text-muted-foreground">Avviato:</span> {new Date(run.startedAt).toLocaleString('it-IT')}</p>
          <p><span className="text-muted-foreground">Completato:</span> {run.completedAt ? new Date(run.completedAt).toLocaleString('it-IT') : '—'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record SEO</CardTitle>
          <CardDescription>Cerca per URL, slug o titolo. Compila `nextjs_target_url` per la mappatura verso il nuovo sito.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={applySearch} className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="q">Cerca</Label>
              <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="/prodotto/..." className="min-w-[240px]" />
            </div>
            <Button type="submit">Filtra</Button>
          </form>

          {!store.records || store.records.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun record in questo export.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>URL WP</TableHead>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Azione</TableHead>
                    <TableHead>Target Next.js</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store.records.items.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-xs">{record.recordType}</TableCell>
                      <TableCell className="max-w-[220px] truncate font-mono text-xs">{record.currentUrl ?? '—'}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs">{record.titleWp ?? record.slug ?? '—'}</TableCell>
                      <TableCell className="text-xs">{record.recommendedAction ?? '—'}</TableCell>
                      <TableCell className="max-w-[180px] truncate font-mono text-xs">{record.nextjsTargetUrl ?? '—'}</TableCell>
                      <TableCell>
                        <Button type="button" variant="outline" size="sm" onClick={() => startEdit(record.id, record)}>
                          Modifica
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <InfiniteScrollSentinel ref={sentinelRef} loading={store.recordsLoadingMore} />
            </div>
          )}
        </CardContent>
      </Card>

      {editingId ? (
        <Card>
          <CardHeader>
            <CardTitle>Mappatura verso Next.js</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nextjsTargetUrl">URL target Next.js</Label>
              <Input id="nextjsTargetUrl" value={nextjsTargetUrl} onChange={(e) => setNextjsTargetUrl(e.target.value)} placeholder="/prodotto/slug/" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoPriority">Priorità SEO</Label>
              <Input id="seoPriority" value={seoPriority} onChange={(e) => setSeoPriority(e.target.value)} placeholder="high" />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="notes">Note</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2 md:col-span-3">
              <Button type="button" variant="success" onClick={() => void saveEdit(editingId)}>Salva</Button>
              <Button type="button" variant="cancel" onClick={() => setEditingId(null)}>Annulla</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
