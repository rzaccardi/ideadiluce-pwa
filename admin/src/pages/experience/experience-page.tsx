import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  fetchStorefrontSettings,
  saveStorefrontSettings,
  storefrontSettingsStore,
} from '@/features/storefront-settings'
import { RoutePageHeader } from '@/components/route-page-header'
import { RouteSkeleton } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function ExperiencePage() {
  const ux = useSnapshot(storefrontSettingsStore)

  useEffect(() => {
    void fetchStorefrontSettings()
  }, [])

  if (ux.isLoading && !ux.settings) {
    return (
      <div className="space-y-6">
        <RoutePageHeader description="Caricamento impostazioni…" />
        <RouteSkeleton variant="form" />
      </div>
    )
  }

  const settings = ux.settings
  if (!settings) {
    return (
      <div className="space-y-6">
        <RoutePageHeader />
        {ux.error ? (
          <Alert variant="destructive">
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{ux.error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <RoutePageHeader
        description={
          settings.soundsEnabled
            ? 'Suoni attivi in negozio · chime e feedback sonori della PWA'
            : 'Suoni disattivati in negozio · la PWA resta muta'
        }
      />

      {ux.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{ux.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Suoni di interfaccia</CardTitle>
          <CardDescription>
            Se disattivati, la PWA non riproduce rumori di conferma (es. aggiunta al carrello) su
            nessun dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <Label htmlFor="ux-sounds" className="flex min-w-0 flex-col gap-1">
            <span className="font-medium text-gray-900">Suoni attivi</span>
            <span className="text-xs font-normal text-gray-500">
              {settings.soundsEnabled ? 'Riprodotti ai visitatori' : 'Disattivati in tutto il negozio'}
            </span>
          </Label>
          <Switch
            id="ux-sounds"
            checked={settings.soundsEnabled}
            disabled={ux.isSaving}
            onCheckedChange={(soundsEnabled) => void saveStorefrontSettings({ soundsEnabled })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
