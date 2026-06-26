import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { RefreshCwIcon } from 'lucide-react'
import {
  fetchSocialProofSettings,
  saveSocialProofSettings,
  socialProofStore,
  syncSocialProofOdoo,
} from '@/features/social-proof'
import { RoutePageHeader } from '@/components/route-page-header'
import { RouteSkeleton } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DetailField } from '@/components/shared/detail-field'

export function SocialProofPage() {
  const sp = useSnapshot(socialProofStore)

  useEffect(() => {
    void fetchSocialProofSettings()
  }, [])

  async function save(patch: Parameters<typeof saveSocialProofSettings>[0]) {
    await saveSocialProofSettings(patch)
  }

  if (sp.isLoading && !sp.settings) {
    return (
      <div className="space-y-6">
        <RoutePageHeader description="Caricamento impostazioni…" />
        <RouteSkeleton />
      </div>
    )
  }

  const settings = sp.settings
  if (!settings) {
    return (
      <div className="space-y-6">
        <RoutePageHeader />
        {sp.error ? (
          <Alert variant="destructive">
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{sp.error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <RoutePageHeader
        description={
          settings.enabled
            ? 'Attivo in negozio · messaggi da ordini PWA e storico Odoo'
            : 'Disattivato in negozio · configura soglie e import Odoo'
        }
      />

      {sp.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{sp.error}</AlertDescription>
        </Alert>
      ) : null}

      {sp.syncMessage ? (
        <Alert>
          <AlertTitle>Sincronizzazione completata</AlertTitle>
          <AlertDescription>{sp.syncMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Visibilità in negozio</CardTitle>
          <CardDescription>
            Se disattivato, la PWA non mostra tab Attività né toast sulle schede prodotto.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <Label htmlFor="sp-enabled" className="flex min-w-0 flex-col gap-1">
            <span className="font-medium text-gray-900">Social proof attivo</span>
            <span className="text-xs font-normal text-gray-500">
              {settings.enabled ? 'Visibile ai visitatori' : 'Nascosto'}
            </span>
          </Label>
          <Switch
            id="sp-enabled"
            checked={settings.enabled}
            disabled={sp.isSaving}
            onCheckedChange={(enabled) => void save({ enabled })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regole di visualizzazione</CardTitle>
          <CardDescription>
            Filtra gli eventi con quantità troppo basse e limita quanti messaggi mostrare.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          <DetailField label="Quantità minima (pezzi)">
            <Input
              id="sp-min-qty"
              type="number"
              min={1}
              defaultValue={settings.minQuantity}
              disabled={sp.isSaving}
              onBlur={(e) => {
                const minQuantity = Math.max(1, Number(e.target.value) || 1)
                if (minQuantity !== settings.minQuantity) void save({ minQuantity })
              }}
            />
            <p className="mt-1 text-xs text-gray-500">
              Es. 10 → mostra solo acquisti con almeno 10 pezzi del prodotto.
            </p>
          </DetailField>
          <DetailField label="Finestra (giorni)">
            <Input
              id="sp-lookback"
              type="number"
              min={1}
              max={365}
              defaultValue={settings.lookbackDays}
              disabled={sp.isSaving}
              onBlur={(e) => {
                const lookbackDays = Math.min(365, Math.max(1, Number(e.target.value) || 30))
                if (lookbackDays !== settings.lookbackDays) void save({ lookbackDays })
              }}
            />
          </DetailField>
          <DetailField label="Eventi massimi in scheda">
            <Input
              id="sp-max"
              type="number"
              min={1}
              max={50}
              defaultValue={settings.maxEvents}
              disabled={sp.isSaving}
              onBlur={(e) => {
                const maxEvents = Math.min(50, Math.max(1, Number(e.target.value) || 12))
                if (maxEvents !== settings.maxEvents) void save({ maxEvents })
              }}
            />
          </DetailField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storico Odoo (pre-PWA)</CardTitle>
          <CardDescription>
            Importa righe confermate da sale.order.line per arricchire il feed oltre agli ordini PWA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={settings.odooConfigured ? 'default' : 'secondary'}>
              Odoo {settings.odooConfigured ? 'configurato' : 'non configurato'}
            </Badge>
            <Badge variant="outline">{settings.cachedOdooEvents} eventi in cache</Badge>
            {settings.odooLastSyncAt ? (
              <span className="text-xs text-gray-500">
                Ultimo sync: {new Date(settings.odooLastSyncAt).toLocaleString('it-IT')}
                {settings.odooLastSyncCount != null ? ` (${settings.odooLastSyncCount} righe)` : ''}
              </span>
            ) : null}
          </div>

          {settings.odooLastSyncError ? (
            <Alert variant="destructive">
              <AlertTitle>Ultimo sync fallito</AlertTitle>
              <AlertDescription>{settings.odooLastSyncError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="sp-odoo-import" className="flex min-w-0 flex-col gap-1">
              <span className="font-medium text-gray-900">Usa ordini Odoo nel feed</span>
              <span className="text-xs font-normal text-gray-500">
                Richiede Odoo attivo e una sincronizzazione periodica.
              </span>
            </Label>
            <Switch
              id="sp-odoo-import"
              checked={settings.odooImportEnabled}
              disabled={sp.isSaving || !settings.odooConfigured}
              onCheckedChange={(odooImportEnabled) => void save({ odooImportEnabled })}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={sp.isSyncing || !settings.odooImportEnabled || !settings.odooConfigured}
            onClick={() => void syncSocialProofOdoo()}
          >
            <RefreshCwIcon className={`h-4 w-4 ${sp.isSyncing ? 'animate-spin' : ''}`} aria-hidden />
            {sp.isSyncing ? 'Import in corso…' : 'Sincronizza da Odoo ora'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
