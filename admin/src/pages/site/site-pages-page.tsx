import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { LanguagesIcon, SaveIcon } from 'lucide-react'
import {
  fetchSitePage,
  fetchSitePagesList,
  saveSitePage,
  SITE_LOCALES,
  SITE_PAGE_OPTIONS,
  siteStore,
  translateSitePage,
  updateDraftContent,
  updateDraftJson,
  type SiteLocale,
} from '@/features/site'
import { SiteContentAccordionEditor } from '@/components/site/site-content-accordion-editor'
import { RoutePageHeader } from '@/components/route-page-header'
import { RouteSkeleton } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const LOCALE_LABELS: Record<SiteLocale, string> = {
  IT: 'Italiano',
  EN: 'Inglese',
  ES: 'Spagnolo',
  FR: 'Francese',
  DE: 'Tedesco',
}

export function SitePagesPage() {
  const sp = useSnapshot(siteStore)

  useEffect(() => {
    void fetchSitePagesList()
    void fetchSitePage(sp.pageKey, sp.locale)
  }, [])

  async function onPageKeyChange(pageKey: string) {
    await fetchSitePage(pageKey, sp.locale)
  }

  async function onLocaleChange(locale: SiteLocale) {
    await fetchSitePage(sp.pageKey, locale)
  }

  async function onSave(translateAllLocales = false) {
    try {
      await saveSitePage(sp.pageKey, sp.locale, sp.current?.published ?? true, {
        translateAllLocales,
      })
      toast.success(
        translateAllLocales
          ? 'Contenuti salvati e tradotti in EN, ES, FR e DE'
          : 'Contenuti salvati',
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Salvataggio fallito')
    }
  }

  async function onTranslateOnly() {
    try {
      const result = await translateSitePage(sp.pageKey)
      toast.success(`Traduzione completata: ${result.targetLocales.join(', ')}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Traduzione fallita')
    }
  }

  const isItalian = sp.locale === 'IT'
  const busy = sp.isSaving || sp.isTranslating || sp.isLoading

  return (
    <div className="space-y-6">
      <RoutePageHeader description="Testi e blocchi editoriali del sito PWA. Modifica per sezione; dalla versione italiana puoi tradurre automaticamente in tutte le lingue con DeepL." />

      {sp.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{sp.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Pagina e lingua</CardTitle>
          <CardDescription>
            Le stringhe statiche sono raggruppate per sezione. Salva in italiano e usa DeepL per propagare EN, ES, FR e DE.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="min-w-[220px] space-y-2">
            <Label>Pagina</Label>
            <Select value={sp.pageKey} onValueChange={(v) => v && void onPageKeyChange(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITE_PAGE_OPTIONS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px] space-y-2">
            <Label>Locale</Label>
            <Select value={sp.locale} onValueChange={(v) => void onLocaleChange(v as SiteLocale)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITE_LOCALES.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {LOCALE_LABELS[loc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {sp.current ? (
            <div className="flex items-center gap-2 pb-1">
              <Switch
                checked={sp.current.published}
                onCheckedChange={(checked) => {
                  if (siteStore.current) siteStore.current.published = checked
                }}
              />
              <Label>Pubblicato</Label>
            </div>
          ) : null}
          <div className="flex items-center gap-2 pb-1">
            <Switch
              checked={sp.showAdvancedJson}
              onCheckedChange={(checked) => {
                siteStore.showAdvancedJson = checked
              }}
            />
            <Label>JSON avanzato</Label>
          </div>
        </CardContent>
      </Card>

      {sp.isLoading && !sp.current ? (
        <RouteSkeleton />
      ) : (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Contenuti</CardTitle>
              <CardDescription>
                {sp.current?.updatedAt
                  ? `Ultimo aggiornamento: ${new Date(sp.current.updatedAt).toLocaleString('it-IT')}`
                  : 'Nessuna revisione salvata — verranno usati i default del server.'}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isItalian ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => void onTranslateOnly()}
                    disabled={busy}
                  >
                    <LanguagesIcon className="size-4" />
                    {sp.isTranslating ? 'Traduzione…' : 'Traduci altre lingue'}
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => void onSave(true)}
                    disabled={busy}
                  >
                    <SaveIcon className="size-4" />
                    {sp.isSaving ? 'Salvataggio…' : 'Salva e traduci'}
                  </Button>
                </>
              ) : null}
              <Button onClick={() => void onSave(false)} disabled={busy}>
                <SaveIcon className="size-4" />
                {sp.isSaving ? 'Salvataggio…' : 'Salva'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sp.showAdvancedJson ? (
              <Textarea
                className="min-h-[480px] font-mono text-xs leading-relaxed"
                value={sp.draftJson}
                onChange={(e) => updateDraftJson(e.target.value)}
                spellCheck={false}
              />
            ) : (
              <SiteContentAccordionEditor
                pageKey={sp.pageKey}
                content={sp.draftContent}
                onChange={updateDraftContent}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
