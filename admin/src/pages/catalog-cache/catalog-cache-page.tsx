import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { DatabaseIcon, RefreshCwIcon } from 'lucide-react'
import {
  fetchCatalogCacheStatus,
  refreshCatalogCacheStatus,
  startCatalogCacheSync,
  catalogCacheStore,
} from '@/features/catalog-cache'
import { RoutePageHeader } from '@/components/route-page-header'
import { DetailField, RouteSkeleton } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

function formatTtlHours(ttlMs: number) {
  const hours = Math.round(ttlMs / (60 * 60 * 1000))
  return `${hours} h`
}

export function CatalogCachePage() {
  const store = useSnapshot(catalogCacheStore)

  useEffect(() => {
    void fetchCatalogCacheStatus()
  }, [])

  useEffect(() => {
    if (!store.isSyncing) return
    const id = window.setInterval(() => {
      void refreshCatalogCacheStatus()
    }, 3000)
    return () => window.clearInterval(id)
  }, [store.isSyncing])

  if (store.isLoading && !store.status) {
    return (
      <div className="space-y-6">
        <RoutePageHeader description="Caricamento stato cache…" />
        <RouteSkeleton />
      </div>
    )
  }

  const status = store.status
  if (!status) {
    return (
      <div className="space-y-6">
        <RoutePageHeader />
        {store.error ? (
          <Alert variant="destructive">
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{store.error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    )
  }

  const anyStale = status.locales.some((l) => l.stale)
  const totalProducts = status.locales.reduce((sum, l) => sum + l.count, 0)

  return (
    <div className="space-y-6">
      <RoutePageHeader
        description={
          status.syncing
            ? 'Sync in corso · aggiornamento automatico ogni 3 secondi'
            : status.configured
              ? `Indice OdooCatalog · TTL ${formatTtlHours(status.ttlMs)} · refresh notturno 03:00 Europe/Rome`
              : 'Integrazione OdooCatalog non configurata'
        }
      />

      {store.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.error}</AlertDescription>
        </Alert>
      ) : null}

      {status.lastSyncError ? (
        <Alert variant="destructive">
          <AlertTitle>Ultimo sync fallito</AlertTitle>
          <AlertDescription>{status.lastSyncError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <DatabaseIcon className="h-4 w-4 text-blue-600" />
              Stato cache catalogo
            </CardTitle>
            <CardDescription>
              Lista, ricerca, filtri e PDP usano questa cache in-memory/disco. Nessuna coda Odoo.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={store.isLoading || status.syncing}
              onClick={() => void refreshCatalogCacheStatus()}
            >
              Aggiorna stato
            </Button>
            <Button
              type="button"
              disabled={!status.configured || status.syncing}
              onClick={() => void startCatalogCacheSync()}
            >
              <RefreshCwIcon className={`mr-2 h-4 w-4 ${status.syncing ? 'animate-spin' : ''}`} />
              {status.syncing ? 'Sync in corso…' : 'Avvia sync'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          <DetailField label="OdooCatalog">
            <Badge variant={status.configured ? 'default' : 'destructive'}>
              {status.configured ? 'Configurato' : 'Non configurato'}
            </Badge>
          </DetailField>
          <DetailField label="Stato indice">
            {status.syncing ? (
              <Badge variant="secondary">Sync in corso</Badge>
            ) : anyStale ? (
              <Badge variant="secondary">Stale (&gt; TTL)</Badge>
            ) : totalProducts > 0 ? (
              <Badge variant="default">Aggiornato</Badge>
            ) : (
              <Badge variant="destructive">Vuoto</Badge>
            )}
          </DetailField>
          <DetailField label="Sync avviato">{formatDateTime(status.syncStartedAt)}</DetailField>
          <DetailField label="Ultimo sync completato">
            {formatDateTime(status.lastSyncFinishedAt)}
          </DetailField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Per lingua</CardTitle>
          <CardDescription>Prodotti in lista, dettagli PDP, categorie e brand in cache.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lingua</TableHead>
                <TableHead className="text-right">Prodotti</TableHead>
                <TableHead className="text-right">Dettagli</TableHead>
                <TableHead className="text-right">Categorie</TableHead>
                <TableHead className="text-right">Brand</TableHead>
                <TableHead>Ultimo sync</TableHead>
                <TableHead>TTL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status.locales.map((locale) => (
                <TableRow key={locale.locale}>
                  <TableCell className="font-medium">{locale.locale}</TableCell>
                  <TableCell className="text-right tabular-nums">{locale.count}</TableCell>
                  <TableCell className="text-right tabular-nums">{locale.details}</TableCell>
                  <TableCell className="text-right tabular-nums">{locale.categories}</TableCell>
                  <TableCell className="text-right tabular-nums">{locale.brands}</TableCell>
                  <TableCell>{formatDateTime(locale.syncedAt)}</TableCell>
                  <TableCell>
                    {locale.stale ? (
                      <Badge variant="secondary">Stale</Badge>
                    ) : (
                      <Badge variant="outline">Ok</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
