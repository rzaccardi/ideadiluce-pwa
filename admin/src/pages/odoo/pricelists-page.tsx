import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { RoutePageHeader } from '@/components/route-page-header'
import { InfiniteScrollSentinel, SearchInput, TableFilters, TableSkeleton } from '@/components/shared'
import {
  assignOdooPricelist,
  fetchOdooPricelistsListDeduped,
  odooStore,
  type OdooPricelistAssignmentInput,
} from '@/features/odoo'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import type { OdooPricelistAssignment } from '@/types/odoo'

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

  const [assignPricelistId, setAssignPricelistId] = useState('')
  const [assignPartnerId, setAssignPartnerId] = useState('')
  const [assignEmail, setAssignEmail] = useState('')
  const [assignUserId, setAssignUserId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignResult, setAssignResult] = useState<OdooPricelistAssignment | null>(null)

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

  async function onAssign(e: React.FormEvent) {
    e.preventDefault()
    setAssignError(null)
    setAssignResult(null)

    const pricelistId = Number(assignPricelistId)
    if (!Number.isInteger(pricelistId) || pricelistId <= 0) {
      setAssignError('Seleziona o indica un listino valido.')
      return
    }

    const body: OdooPricelistAssignmentInput = { pricelistId }
    const partnerId = assignPartnerId.trim() ? Number(assignPartnerId) : undefined
    const email = assignEmail.trim() || undefined
    const userId = assignUserId.trim() || undefined

    if (partnerId != null && Number.isInteger(partnerId) && partnerId > 0) {
      body.partnerId = partnerId
    } else if (email) {
      body.email = email
    } else if (userId) {
      body.userId = userId
    } else {
      setAssignError('Indica partner Odoo, email o ID utente PWA.')
      return
    }

    setAssignLoading(true)
    try {
      setAssignResult(await assignOdooPricelist(body))
    } catch (err) {
      setAssignError(String(err))
    } finally {
      setAssignLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <RoutePageHeader
        description={
          store.pricelistsList != null
            ? `${store.pricelistsList.total} listini Odoo (product.pricelist)`
            : 'Listini prezzi Odoo e assegnazione su res.partner'
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Assegna listino</CardTitle>
          <CardDescription>
            Imposta property_product_pricelist su un partner Odoo. Usa partner ID, email o ID utente PWA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onAssign(e)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="assign-pricelist">Listino</Label>
                <Select
                  value={assignPricelistId || undefined}
                  onValueChange={(v) => setAssignPricelistId(v ?? '')}
                >
                  <SelectTrigger id="assign-pricelist" className="h-10 w-full">
                    <SelectValue placeholder="Seleziona listino…" />
                  </SelectTrigger>
                  <SelectContent>
                    {store.pricelistsListItems.map((pl) => (
                      <SelectItem key={pl.id} value={String(pl.id)}>
                        {pl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-partner-id">Partner Odoo ID</Label>
                <Input
                  id="assign-partner-id"
                  className="h-10"
                  inputMode="numeric"
                  value={assignPartnerId}
                  onChange={(e) => setAssignPartnerId(e.target.value)}
                  placeholder="es. 42"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-email">Email cliente</Label>
                <Input
                  id="assign-email"
                  className="h-10"
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  placeholder="cliente@esempio.it"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-user-id">ID utente PWA</Label>
                <Input
                  id="assign-user-id"
                  className="h-10"
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  placeholder="UUID utente"
                />
              </div>
            </div>

            {assignError ? (
              <Alert variant="destructive">
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>{assignError}</AlertDescription>
              </Alert>
            ) : null}

            {assignResult ? (
              <Alert>
                <AlertTitle>Listino assegnato</AlertTitle>
                <AlertDescription>
                  {assignResult.partnerName ?? `Partner #${assignResult.partnerId}`} →{' '}
                  {assignResult.pricelistName ?? `Listino #${assignResult.pricelistId}`}
                  {assignResult.localUserUpdated ? ' · Utente PWA aggiornato' : ''}
                </AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" variant="success" disabled={assignLoading}>
              {assignLoading ? 'Assegnazione…' : 'Assegna listino'}
            </Button>
          </form>
        </CardContent>
      </Card>

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
