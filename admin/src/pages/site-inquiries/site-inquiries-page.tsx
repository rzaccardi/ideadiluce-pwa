import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { RoutePageHeader } from '@/components/route-page-header'
import { ClickableTableRow, SearchInput, TableFilters, TableSkeleton } from '@/components/shared'
import {
  adminSiteInquiriesStore,
  fetchAdminSiteInquiriesListDeduped,
} from '@/features/site-inquiries'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import {
  SITE_INQUIRY_KIND_FILTER_OPTIONS,
  SITE_INQUIRY_STATUS_FILTER_OPTIONS,
  siteInquiryKindLabel,
  siteInquiryStatusLabel,
  type SiteInquiryAdminKind,
  type SiteInquiryAdminStatus,
} from '@/types/site-inquiries'
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

type StatusFilter = 'all' | SiteInquiryAdminStatus
type KindFilter = 'all' | SiteInquiryAdminKind

function buildListQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    status: searchParams.get('status') ?? 'all',
    kind: searchParams.get('kind') ?? 'all',
  })
  const q = searchParams.get('q')
  if (q) params.set('q', q)
  return params.toString()
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'DONE') return 'default'
  if (status === 'ARCHIVED') return 'outline'
  return 'secondary'
}

export function SiteInquiriesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const store = useSnapshot(adminSiteInquiriesStore)

  const status = (searchParams.get('status') ?? 'all') as StatusFilter
  const kind = (searchParams.get('kind') ?? 'all') as KindFilter
  const page = Number(searchParams.get('page') ?? '1')
  const listQuery = useMemo(() => buildListQuery(searchParams, page), [searchParams, page])

  const hasMore =
    store.list != null && store.list.page < store.list.totalPages && store.listItems.length > 0

  useEffect(() => {
    void fetchAdminSiteInquiriesListDeduped(listQuery, { append: page > 1 })
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

  function setStatus(next: StatusFilter) {
    const p = new URLSearchParams(searchParams)
    p.set('status', next)
    p.delete('page')
    setSearchParams(p, { replace: true })
  }

  function setKind(next: KindFilter) {
    const p = new URLSearchParams(searchParams)
    p.set('kind', next)
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
        title="Richieste contatto"
        description="Moduli inviati da Contatti, prodotto non trovato e lead business"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Elenco richieste</CardTitle>
          <CardDescription>
            Ogni invio viene salvato qui e inviato anche via email a info@ideadiluce.com.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={applySearch}>
            <TableFilters
              search={
                <SearchInput
                  id="site-inquiry-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nome, email, telefono, codice…"
                />
              }
              filters={
                <>
                  <div className="flex flex-col gap-1.5 sm:min-w-[180px]">
                    <Label htmlFor="site-inquiry-kind">Tipo</Label>
                    <Select value={kind} onValueChange={(v) => setKind(v as KindFilter)}>
                      <SelectTrigger id="site-inquiry-kind" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SITE_INQUIRY_KIND_FILTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:min-w-[180px]">
                    <Label htmlFor="site-inquiry-status">Stato</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                      <SelectTrigger id="site-inquiry-status" className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SITE_INQUIRY_STATUS_FILTER_OPTIONS.map((opt) => (
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

          {store.listLoading && store.listItems.length === 0 ? (
            <TableSkeleton
              rows={8}
              columns={['Data', 'Tipo', 'Nome', 'Email', 'Telefono', 'Stato']}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.listItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nessuna richiesta trovata.
                    </TableCell>
                  </TableRow>
                ) : (
                  store.listItems.map((row) => (
                    <ClickableTableRow key={row.id} to={`/site-inquiries/${row.id}`}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(row.createdAt).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell>{siteInquiryKindLabel(row.kind)}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.phone ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(row.status)}>
                          {siteInquiryStatusLabel(row.status)}
                        </Badge>
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
