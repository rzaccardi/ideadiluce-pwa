import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { RoutePageHeader } from '@/components/route-page-header'
import { ClickableTableRow, SearchInput, TableFilters, TableSkeleton } from '@/components/shared'
import {
  adminMailLogStore,
  fetchAdminMailLogListDeduped,
} from '@/features/mail-log'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import {
  MAIL_LOG_STATE_FILTER_OPTIONS,
  MAIL_LOG_TEMPLATE_FILTER_OPTIONS,
  mailLogStateLabel,
} from '@/types/mail-log'
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
import { formatDateTime } from '@/lib/format'

const PAGE_SIZE = 25

function buildListQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    state: searchParams.get('state') ?? 'all',
    templateKey: searchParams.get('templateKey') ?? 'all',
  })
  const q = searchParams.get('q')
  if (q) params.set('q', q)
  return params.toString()
}

function stateBadgeVariant(state: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (state === 'sent') return 'default'
  if (state === 'exception' || state === 'bounce') return 'destructive'
  if (state === 'cancel') return 'outline'
  return 'secondary'
}

export function MailLogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const store = useSnapshot(adminMailLogStore)

  const state = searchParams.get('state') ?? 'all'
  const templateKey = searchParams.get('templateKey') ?? 'all'
  const page = Number(searchParams.get('page') ?? '1')
  const listQuery = useMemo(() => buildListQuery(searchParams, page), [searchParams, page])

  const hasMore =
    store.list != null && store.list.page < store.list.totalPages && store.listItems.length > 0

  useEffect(() => {
    void fetchAdminMailLogListDeduped(listQuery, { append: page > 1 })
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

  function setFilter(key: 'state' | 'templateKey', next: string) {
    const p = new URLSearchParams(searchParams)
    p.set(key, next)
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
    <div className="flex flex-col gap-6">
      <RoutePageHeader
        title="Email inviate"
        description="Storico delle email transazionali del sito, conservato in Odoo"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registro email</CardTitle>
          <CardDescription>
            Stato da Odoo: <strong>Inviata</strong> = il server di posta ha accettato il messaggio;
            <strong> Errore invio</strong> o <strong>Non consegnata</strong> = fallimento, con il
            motivo sotto. Non è una conferma di lettura.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={applySearch}>
            <TableFilters
              search={
                <SearchInput
                  id="mail-log-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Destinatario o oggetto…"
                />
              }
              filters={
                <>
                  <div className="flex min-w-0 flex-col gap-1.5 sm:min-w-[180px]">
                    <Label htmlFor="mail-log-template">Tipo</Label>
                    <Select
                      value={templateKey}
                      onValueChange={(v) => {
                        if (v) setFilter('templateKey', v)
                      }}
                    >
                      <SelectTrigger id="mail-log-template" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MAIL_LOG_TEMPLATE_FILTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5 sm:min-w-[160px]">
                    <Label htmlFor="mail-log-state">Stato</Label>
                    <Select
                      value={state}
                      onValueChange={(v) => {
                        if (v) setFilter('state', v)
                      }}
                    >
                      <SelectTrigger id="mail-log-state" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MAIL_LOG_STATE_FILTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              }
            />
          </form>

          {store.listError ? (
            <Alert variant="destructive">
              <AlertTitle>Errore</AlertTitle>
              <AlertDescription>{store.listError}</AlertDescription>
            </Alert>
          ) : null}

          {store.list && !store.list.configured ? (
            <Alert>
              <AlertTitle>Odoo non configurato</AlertTitle>
              <AlertDescription>
                Lo storico email vive in Odoo. Configura l&apos;integrazione per vederle qui.
              </AlertDescription>
            </Alert>
          ) : null}

          {store.listLoading && store.listItems.length === 0 ? (
            <TableSkeleton rows={8} columns={['Data', 'Tipo', 'Destinatario', 'Oggetto', 'Stato']} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Oggetto</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.listItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nessuna email trovata.
                    </TableCell>
                  </TableRow>
                ) : (
                  store.listItems.map((row) => (
                    <ClickableTableRow key={row.id} to={`/mail-log/${row.id}`}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(row.sentAt)}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">{row.templateLabel}</TableCell>
                      <TableCell className="max-w-[220px] truncate font-medium">{row.emailTo}</TableCell>
                      <TableCell className="max-w-[280px] truncate">{row.subject}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <Badge variant={stateBadgeVariant(row.deliveryState || row.state)}>
                            {mailLogStateLabel(row.deliveryState || row.state, row.deliveryLabel)}
                          </Badge>
                          {row.failureReason ? (
                            <span className="max-w-[220px] truncate text-xs text-red-600">
                              {row.failureReason}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                    </ClickableTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <div ref={sentinelRef} />
        </CardContent>
      </Card>
    </div>
  )
}
