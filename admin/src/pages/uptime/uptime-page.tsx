import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  adminUptimeStore,
  ensureAdminUptimeMonitors,
  fetchAdminUptimeOverview,
  refreshAdminUptimeOverview,
} from '@/features/uptime'
import { RoutePageHeader } from '@/components/route-page-header'
import { DetailField, EmptyState, RouteSkeleton } from '@/components/shared'
import {
  sslExpiryWarning,
  UPTIME_LOG_LABELS,
  UPTIME_TYPE_LABELS,
  uptimeStatusLabel,
  type UptimeMonitorStatus,
} from '@/types/uptime'
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

function statusBadgeVariant(
  status: UptimeMonitorStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'up') return 'default'
  if (status === 'down' || status === 'seems_down') return 'destructive'
  if (status === 'paused') return 'outline'
  return 'secondary'
}

function formatPct(value: number | null): string {
  if (value == null) return '—'
  return `${value.toLocaleString('it-IT', { maximumFractionDigits: 3 })}%`
}

function formatMs(value: number | null): string {
  if (value == null) return '—'
  return `${Math.round(value)} ms`
}

function sslLabel(iso: string | null): string {
  if (!iso) return '—'
  const warn = sslExpiryWarning(iso)
  const when = formatDateTime(iso)
  if (warn === 'expired') return `Scaduto ${when}`
  if (warn === 'soon') return `Scade ${when}`
  return when
}

export function UptimePage() {
  const store = useSnapshot(adminUptimeStore)

  useEffect(() => {
    void fetchAdminUptimeOverview()
  }, [])

  useEffect(() => {
    if (!store.overview?.configured) return
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void refreshAdminUptimeOverview()
    }, 45_000)
    return () => window.clearInterval(id)
  }, [store.overview?.configured])

  async function onEnsure() {
    try {
      const result = await ensureAdminUptimeMonitors()
      if (result.created.length === 0) {
        toast.success('Tutti i monitor consigliati sono già presenti')
        return
      }
      toast.success(
        result.created.length === 1
          ? 'Creato 1 monitor su UptimeRobot'
          : `Creati ${result.created.length} monitor su UptimeRobot`,
      )
    } catch (e) {
      toast.error(String(e))
    }
  }

  if (store.loading && !store.overview) {
    return (
      <div className="space-y-6">
        <RoutePageHeader description="Caricamento stato UptimeRobot…" />
        <RouteSkeleton />
      </div>
    )
  }

  const overview = store.overview
  if (!overview) {
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

  const missing = overview.recommended.filter((row) => !row.present)
  const downCount = overview.monitors.filter(
    (m) => m.status === 'down' || m.status === 'seems_down',
  ).length
  const sslSoon = overview.monitors.filter((m) => {
    const warn = sslExpiryWarning(m.sslExpiresAt)
    return warn === 'soon' || warn === 'expired'
  })

  return (
    <div className="space-y-6">
      <RoutePageHeader
        description={
          overview.configured
            ? `Stato da UptimeRobot · aggiornato ${formatDateTime(overview.fetchedAt)}`
            : 'Collega UptimeRobot per vedere sito, API e Odoo da questa pagina'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={store.loading || store.ensuring}
              onClick={() => void refreshAdminUptimeOverview()}
            >
              <RefreshCwIcon className={`h-4 w-4 ${store.loading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
            <Button
              variant="outline"
              render={
                <a href={overview.dashboardUrl} target="_blank" rel="noreferrer" />
              }
            >
              Apri UptimeRobot
              <ExternalLinkIcon className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {store.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.error}</AlertDescription>
        </Alert>
      ) : null}

      {!overview.configured ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ActivityIcon className="h-4 w-4 text-rose-600" />
              Configura UptimeRobot
            </CardTitle>
            <CardDescription>
              Il piano free copre 50 monitor ogni 5 minuti, abbastanza per shop, API, catalogo, Odoo
              e back office. Gli alert arrivano su email, Slack o l’app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Crea un account su{' '}
                <a
                  href="https://uptimerobot.com/"
                  className="text-sky-600 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  uptimerobot.com
                </a>
              </li>
              <li>
                In Integrations &amp; API crea la <span className="font-medium text-gray-900">Main API Key</span>
                {' '}(read-write se vuoi creare i monitor da qui; sola lettura se li crei a mano)
              </li>
              <li>
                Imposta <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">UPTIMEROBOT_API_KEY</code> sul
                componente <span className="font-medium text-gray-900">api</span> in DigitalOcean
              </li>
              <li>Ricarica questa pagina e premi «Crea i monitor consigliati»</li>
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {overview.configured && downCount > 0 ? (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>
            {downCount === 1 ? '1 servizio non risponde' : `${downCount} servizi non rispondono`}
          </AlertTitle>
          <AlertDescription>
            Controlla i monitor in rosso e gli incidenti recenti. Gli alert UptimeRobot partono in
            parallelo su email e canali collegati.
          </AlertDescription>
        </Alert>
      ) : null}

      {sslSoon.length > 0 ? (
        <Alert>
          <AlertTriangleIcon />
          <AlertTitle>Certificato SSL in scadenza</AlertTitle>
          <AlertDescription>
            {sslSoon.map((m) => m.name).join(', ')} — rinnovo da verificare su DigitalOcean o sul
            dominio custom.
          </AlertDescription>
        </Alert>
      ) : null}

      {overview.configured ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sintesi</CardTitle>
            <CardDescription>
              {overview.account
                ? `Piano: ${overview.account.monitorLimit} monitor, check ogni ${overview.account.monitorIntervalMinutes} min`
                : 'Account UptimeRobot collegato'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            <DetailField label="Online">{overview.account?.up ?? overview.monitors.filter((m) => m.status === 'up').length}</DetailField>
            <DetailField label="Down">
              <span className={downCount > 0 ? 'text-destructive font-medium' : undefined}>
                {overview.account?.down ?? downCount}
              </span>
            </DetailField>
            <DetailField label="In pausa">{overview.account?.paused ?? 0}</DetailField>
            <DetailField label="Consigliati mancanti">
              <span className={overview.missingRecommended > 0 ? 'font-medium text-amber-700' : undefined}>
                {overview.missingRecommended}
              </span>
            </DetailField>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Cosa monitorare</CardTitle>
            <CardDescription>
              Shop, API (via sito e diretta), indice catalogo, sitemap, Merchant feed, Odoo e back
              office. Heartbeat sui job in-process si può aggiungere dopo su UptimeRobot.
            </CardDescription>
          </div>
          <Button
            type="button"
            disabled={!overview.configured || store.ensuring || missing.length === 0}
            onClick={() => void onEnsure()}
          >
            {store.ensuring
              ? 'Creazione…'
              : missing.length === 0
                ? 'Tutto creato'
                : `Crea i monitor consigliati (${missing.length})`}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monitor</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="hidden lg:table-cell">URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.recommended.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="min-w-0">
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.description}</p>
                  </TableCell>
                  <TableCell className="hidden text-sm text-gray-600 sm:table-cell">
                    {row.type === 'keyword' ? `Keyword «${row.keyword}»` : 'HTTP'}
                  </TableCell>
                  <TableCell>
                    {row.present ? (
                      <Badge variant="default">
                        <CheckIcon />
                        Attivo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Da creare</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden max-w-xs min-w-0 truncate text-xs text-gray-500 lg:table-cell">
                    {row.url}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Monitor</CardTitle>
          <CardDescription>
            Uptime 7 e 30 giorni, tempo di risposta e scadenza SSL. I nomi con prefisso «IDL ·» sono
            quelli creati da questo back office.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {overview.monitors.length === 0 ? (
            <EmptyState
              title={overview.configured ? 'Nessun monitor' : 'Nessun dato'}
              description={
                overview.configured
                  ? 'Crea i monitor consigliati oppure aggiungili da UptimeRobot.'
                  : 'Collega la chiave API per vedere lo stato in tempo reale.'
              }
              icon={ActivityIcon}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Uptime 7g</TableHead>
                  <TableHead className="hidden md:table-cell">Uptime 30g</TableHead>
                  <TableHead className="hidden lg:table-cell">Risposta</TableHead>
                  <TableHead className="hidden xl:table-cell">SSL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.monitors.map((monitor) => {
                  const sslWarn = sslExpiryWarning(monitor.sslExpiresAt)
                  return (
                    <TableRow key={monitor.id}>
                      <TableCell className="min-w-0">
                        <p className="font-medium text-gray-900">{monitor.name}</p>
                        <p className="max-w-xs truncate text-xs text-gray-500">{monitor.url}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(monitor.status)}>
                          {uptimeStatusLabel(monitor.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-gray-600 sm:table-cell">
                        {UPTIME_TYPE_LABELS[monitor.type]}
                      </TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">
                        {formatPct(monitor.uptime7d)}
                      </TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">
                        {formatPct(monitor.uptime30d)}
                      </TableCell>
                      <TableCell className="hidden tabular-nums lg:table-cell">
                        {formatMs(monitor.lastResponseMs)}
                      </TableCell>
                      <TableCell
                        className={`hidden text-sm xl:table-cell ${
                          sslWarn === 'soon' || sslWarn === 'expired' ? 'text-destructive' : 'text-gray-600'
                        }`}
                      >
                        {sslLabel(monitor.sslExpiresAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {overview.incidents.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Incidenti recenti</CardTitle>
            <CardDescription>Ultimi down e ripristini registrati da UptimeRobot.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Monitor</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead className="hidden sm:table-cell">Dettaglio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.incidents.map((incident, i) => (
                  <TableRow key={`${incident.monitorId}-${incident.at}-${i}`}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(incident.at)}
                    </TableCell>
                    <TableCell className="font-medium">{incident.monitorName}</TableCell>
                    <TableCell>
                      <Badge variant={incident.type === 'down' ? 'destructive' : 'secondary'}>
                        {UPTIME_LOG_LABELS[incident.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-gray-500 sm:table-cell">
                      {incident.reason || (incident.durationSeconds ? `${incident.durationSeconds} s` : '—')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {overview.statusPages.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pagine stato</CardTitle>
            <CardDescription>
              Status page pubbliche da condividere con il team o, se serve, con i clienti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-4 sm:p-6">
            {overview.statusPages.map((page) => (
              <a
                key={page.id}
                href={page.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-sky-600 hover:underline"
              >
                {page.name}
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
