import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { toast } from 'sonner'
import { RoutePageHeader } from '@/components/route-page-header'
import { RouteSkeleton } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  loadOdooResiliencePage,
  odooStore,
  requeueAllExhaustedOdooSync,
  retryOdooSyncQueueItem,
  saveOdooResilience,
} from '@/features/odoo'
import { formatDateTime } from '@/lib/format'
import type { OdooSyncOperation } from '@/types/odoo'

const LIST_QUERY = 'page=1&pageSize=50'

const OPERATION_LABEL: Record<OdooSyncOperation, string> = {
  ENSURE_PARTNER: 'Crea/trova partner',
  ENSURE_SALE_ORDER: 'Crea ordine Odoo',
  RECONCILE_LINES: 'Allinea righe',
  FUNNEL_SYNC: 'Registra pagamento',
  ENSURE_PORTAL_USER: 'Utente portale',
  SEND_MAIL: 'Invia email',
}

function statusBadge(status: string) {
  if (status === 'EXHAUSTED') return <Badge variant="destructive">Esaurita</Badge>
  if (status === 'PROCESSING') return <Badge>In corso</Badge>
  if (status === 'COMPLETED') return <Badge variant="secondary">Completata</Badge>
  return <Badge variant="outline">In coda</Badge>
}

export function OdooResiliencePage() {
  const store = useSnapshot(odooStore)

  useEffect(() => {
    void loadOdooResiliencePage(LIST_QUERY)
  }, [])

  const emergency = Boolean(
    store.resilience?.emergencyMode || store.resilience?.envEmergencyOverride,
  )

  const pendingCount = store.status?.pendingSyncCount ?? 0
  const exhaustedCount = store.status?.exhaustedSyncCount ?? 0

  const items = useMemo(() => store.syncQueueListItems, [store.syncQueueListItems])

  if ((store.statusLoading || store.resilienceLoading) && !store.resilience) {
    return (
      <div className="space-y-6">
        <RoutePageHeader description="Caricamento resilienza Odoo…" />
        <RouteSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <RoutePageHeader description="Checkout e catalogo restano online se Odoo è in manutenzione. I comandi restano in coda e si rinviano al ritorno." />

      {emergency ? (
        <Alert>
          <AlertTitle>Modalità emergenza attiva</AlertTitle>
          <AlertDescription>
            Il negozio non chiama Odoo sul percorso critico. Partner, ordini, pagamenti e mail
            vengono accodati e riprovati automaticamente.
            {store.resilience?.envEmergencyOverride
              ? ' Override da variabile d’ambiente ODOO_EMERGENCY_MODE.'
              : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kill switch</CardTitle>
            <CardDescription>
              Attivalo prima di un aggiornamento Odoo o se il ping XML-RPC fallisce.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="emergency-mode">Modalità emergenza</Label>
                <p className="text-sm text-muted-foreground">
                  Lock e pagamento restano locali; sync Odoo in coda.
                </p>
              </div>
              <Switch
                id="emergency-mode"
                checked={Boolean(store.resilience?.emergencyMode)}
                disabled={store.resilienceSaving || store.resilience?.envEmergencyOverride}
                onCheckedChange={(checked) => {
                  void saveOdooResilience({ emergencyMode: checked })
                    .then(() => toast.success(checked ? 'Modalità emergenza attiva' : 'Modalità emergenza disattivata'))
                    .catch((e) => toast.error(String(e)))
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="catalog-fallback">Fallback cache catalogo</Label>
                <p className="text-sm text-muted-foreground">
                  Listing e PDP dall’indice locale se l’API catalogo è giù.
                </p>
              </div>
              <Switch
                id="catalog-fallback"
                checked={store.resilience?.catalogCacheFallback ?? true}
                disabled={store.resilienceSaving}
                onCheckedChange={(checked) => {
                  void saveOdooResilience({ catalogCacheFallback: checked })
                    .then(() => toast.success('Impostazione catalogo salvata'))
                    .catch((e) => toast.error(String(e)))
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="smtp-fallback">Fallback SMTP</Label>
                <p className="text-sm text-muted-foreground">
                  Se Odoo mail non risponde, invia via SMTP
                  {store.resilience?.smtpConfigured ? '.' : ' (SMTP non configurato: solo log).'}
                </p>
              </div>
              <Switch
                id="smtp-fallback"
                checked={store.resilience?.smtpFallback ?? true}
                disabled={store.resilienceSaving}
                onCheckedChange={(checked) => {
                  void saveOdooResilience({ smtpFallback: checked })
                    .then(() => toast.success('Impostazione email salvata'))
                    .catch((e) => toast.error(String(e)))
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stato Odoo</CardTitle>
            <CardDescription>Ping XML-RPC e coda comandi da reinviare.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              XML-RPC:{' '}
              {store.status?.pingOk ? (
                <Badge>Raggiungibile</Badge>
              ) : (
                <Badge variant="destructive">Non raggiungibile</Badge>
              )}
            </p>
            <p>
              In coda: <span className="font-medium">{pendingCount}</span>
              {' · '}
              Esaurite: <span className="font-medium">{exhaustedCount}</span>
            </p>
            {(store.status?.notes ?? []).map((noteLine) => (
              <p key={noteLine} className="text-muted-foreground">
                {noteLine}
              </p>
            ))}
            {exhaustedCount > 0 ? (
              <Button
                variant="outline"
                disabled={store.syncQueueRequeueing}
                onClick={() => {
                  void requeueAllExhaustedOdooSync(LIST_QUERY)
                    .then(() => toast.success('Comandi esauriti reimmessi in coda'))
                    .catch((e) => toast.error(String(e)))
                }}
              >
                Reimmetti comandi esauriti
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coda comandi Odoo</CardTitle>
          <CardDescription>
            Partner, sale.order, righe, pagamento, portale e email. Retry automatico con backoff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {store.syncQueueListError ? (
            <p className="mb-4 text-sm text-destructive">{store.syncQueueListError}</p>
          ) : null}
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun comando in coda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operazione</TableHead>
                  <TableHead>Ordine / email</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Tentativi</TableHead>
                  <TableHead>Prossimo retry</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {OPERATION_LABEL[row.operation] ?? row.operation}
                    </TableCell>
                    <TableCell className="min-w-0">
                      {row.pwaOrderId ? (
                        <Link to={`/orders/${row.pwaOrderId}`} className="block truncate underline">
                          {row.orderEmail ?? row.pwaOrderId}
                        </Link>
                      ) : (
                        <span className="truncate text-muted-foreground">{row.orderEmail ?? row.userId ?? '—'}</span>
                      )}
                      {row.lastError ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.lastError}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>{statusBadge(row.status)}</TableCell>
                    <TableCell>
                      {row.attempts}/{row.maxAttempts}
                    </TableCell>
                    <TableCell>{formatDateTime(row.nextRetryAt)}</TableCell>
                    <TableCell className="text-right">
                      {row.status !== 'COMPLETED' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={store.syncQueueRetryingId === row.id}
                          onClick={() => {
                            void retryOdooSyncQueueItem(row.id, LIST_QUERY)
                          }}
                        >
                          Riprova
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Cache catalogo:{' '}
            <Link to="/catalog-cache" className="underline">
              indice locale
            </Link>
            . SMTP va configurato in produzione come piano B delle email Odoo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
