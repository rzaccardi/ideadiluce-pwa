import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { toast } from 'sonner'
import {
  fetchStorefrontSettings,
  saveStorefrontSettings,
  storefrontSettingsStore,
} from '@/features/storefront-settings'
import { RoutePageHeader } from '@/components/route-page-header'
import { RouteSkeleton } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const DEFAULT_LEGACY_SITE_URL = 'https://old.ideadiluce.it'

export function ExperiencePage() {
  const ux = useSnapshot(storefrontSettingsStore)
  const [legacyUrl, setLegacyUrl] = useState(DEFAULT_LEGACY_SITE_URL)

  useEffect(() => {
    void fetchStorefrontSettings()
  }, [])

  useEffect(() => {
    if (ux.settings?.legacySiteUrl) {
      setLegacyUrl(ux.settings.legacySiteUrl)
    }
  }, [ux.settings?.legacySiteUrl])

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

  async function persist(patch: Parameters<typeof saveStorefrontSettings>[0], message: string) {
    try {
      await saveStorefrontSettings(patch)
      toast.success(message)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Salvataggio fallito')
    }
  }

  async function persistLegacyUrl() {
    const currentUrl = ux.settings?.legacySiteUrl
    const value = legacyUrl.trim() || DEFAULT_LEGACY_SITE_URL
    if (value === currentUrl) return
    try {
      const parsed = new URL(value)
      if (parsed.protocol !== 'https:') {
        toast.error('L’URL deve essere HTTPS')
        return
      }
    } catch {
      toast.error('Inserisci un URL HTTPS valido')
      return
    }
    await persist({ legacySiteUrl: value }, 'URL del sito precedente aggiornato')
  }

  return (
    <div className="space-y-6">
      <RoutePageHeader
        description={
          settings.legacySiteNoticeEnabled
            ? 'Avviso «sito precedente» visibile in negozio'
            : settings.soundsEnabled
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Sito precedente (go-live)</CardTitle>
              <CardDescription>
                Mostra in alto, in checkout e nel footer un invito a continuare su
                old.ideadiluce.it se il nuovo sito ha problemi. Attivalo al lancio e
                spegnilo quando è stabile.
              </CardDescription>
            </div>
            <Badge variant={settings.legacySiteNoticeEnabled ? 'default' : 'secondary'}>
              {settings.legacySiteNoticeEnabled ? 'Visibile in negozio' : 'Nascosto'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="ux-legacy-notice" className="flex min-w-0 flex-col gap-1">
              <span className="font-medium text-gray-900">Avviso sempre visibile</span>
              <span className="text-xs font-normal text-gray-500">
                Barra in alto su tutte le pagine, riquadro in checkout e link nel footer.
                Non è un popup: resta a disposizione se l’ordine non va a buon fine.
              </span>
            </Label>
            <Switch
              id="ux-legacy-notice"
              checked={settings.legacySiteNoticeEnabled}
              disabled={ux.isSaving}
              onCheckedChange={(legacySiteNoticeEnabled) =>
                void persist(
                  { legacySiteNoticeEnabled },
                  legacySiteNoticeEnabled
                    ? 'Avviso sito precedente attivo in negozio'
                    : 'Avviso sito precedente nascosto',
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ux-legacy-url">URL del sito precedente</Label>
            <Input
              id="ux-legacy-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-sm"
              value={legacyUrl}
              disabled={ux.isSaving}
              onChange={(e) => setLegacyUrl(e.target.value)}
              onBlur={() => void persistLegacyUrl()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
            />
            <p className="text-xs text-gray-500">
              Deve essere HTTPS. Default: {DEFAULT_LEGACY_SITE_URL}
            </p>
          </div>
        </CardContent>
      </Card>

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
