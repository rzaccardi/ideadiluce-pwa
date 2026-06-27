import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { ArrowLeftIcon, LanguagesIcon, SaveIcon, SparklesIcon } from 'lucide-react'
import {
  fetchSitePageAllLocales,
  isSiteDraftDirty,
  refreshSiteTranslationOverview,
  saveSitePage,
  saveSitePageAllDirtyLocales,
  setSiteFieldSearch,
  setSiteLocalePublished,
  SITE_LOCALES,
  siteStore,
  translateSitePage,
  updateLocaleDraftContent,
  getSitePageLabel,
  isValidSitePageKey,
  type SiteLocale,
} from '@/features/site'
import { SiteContentMultiLocaleAccordionEditor } from '@/components/site/site-content-multi-locale-accordion-editor'
import { DetailPageActionBar, RouteSkeleton, SearchInput, SitePageHeader } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

const LOCALE_LABELS: Record<SiteLocale, string> = {
  IT: 'Italiano',
  EN: 'Inglese',
  ES: 'Spagnolo',
  FR: 'Francese',
  DE: 'Tedesco',
}

export function SitePageDetailPage() {
  const { pageKey = '' } = useParams<{ pageKey: string }>()
  const sp = useSnapshot(siteStore)
  const isDirty = isSiteDraftDirty()
  const currentPageCatalog = sp.catalog?.pages.find((page) => page.pageKey === pageKey)
  const currentMissingLocales = currentPageCatalog?.missingLocales ?? []
  const pageLabel = getSitePageLabel(pageKey)

  useEffect(() => {
    if (!isValidSitePageKey(pageKey)) return
    void fetchSitePageAllLocales(pageKey)
    void refreshSiteTranslationOverview()
  }, [pageKey])

  if (!isValidSitePageKey(pageKey)) {
    return <Navigate to="/site" replace />
  }

  async function onSaveItalian(translateAllLocales = false) {
    try {
      await saveSitePage(pageKey, 'IT', sp.localeDrafts.IT?.published ?? true, { translateAllLocales })
      toast.success(
        translateAllLocales
          ? 'Contenuti salvati e tradotti in EN, ES, FR e DE'
          : 'Contenuti italiani salvati',
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Salvataggio fallito')
    }
  }

  async function onSaveAllDirty() {
    try {
      await saveSitePageAllDirtyLocales(pageKey)
      toast.success('Tutte le modifiche salvate')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Salvataggio fallito')
    }
  }

  async function onTranslateAll(onlyMissingLocales = false) {
    try {
      const result = await translateSitePage(pageKey, { onlyMissingLocales })
      const created = result.targetLocales.length
      const skipped = result.skippedLocales?.length ?? 0
      if (onlyMissingLocales) {
        toast.success(
          created > 0
            ? `Create ${created} traduzioni mancanti${skipped ? ` (${skipped} già presenti)` : ''}`
            : 'Nessuna traduzione mancante per questa pagina',
        )
      } else {
        toast.success(`Traduzione completata: ${result.targetLocales.join(', ')}`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Traduzione fallita')
    }
  }

  const busy = sp.isSaving || sp.isTranslating || sp.isBulkTranslating || sp.isLoading
  const draftsByLocale = Object.fromEntries(
    SITE_LOCALES.map((locale) => [locale, sp.localeDrafts[locale]?.content ?? {}]),
  ) as Record<SiteLocale, Record<string, unknown>>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SitePageHeader
          title={pageLabel}
          description="Modifica i testi in tutte le lingue. L'italiano è la sorgente per DeepL."
        />
        <DetailPageActionBar
          stickyOnMobile
          secondary={
            <Button variant="outline" className="w-full lg:w-auto" render={<Link to="/site" />}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Elenco pagine
            </Button>
          }
          primary={
            <>
              {currentMissingLocales.length > 0 ? (
                <Button variant="outline" onClick={() => void onTranslateAll(true)} disabled={busy}>
                  <SparklesIcon className="size-4" />
                  {sp.isTranslating ? 'Traduzione…' : 'Traduci mancanti'}
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => void onTranslateAll(false)} disabled={busy}>
                <LanguagesIcon className="size-4" />
                {sp.isTranslating ? 'Traduzione…' : 'Rigenera traduzioni'}
              </Button>
              <Button variant="success" onClick={() => void onSaveItalian(true)} disabled={busy}>
                <SaveIcon className="size-4" />
                {sp.isSaving ? 'Salvataggio…' : 'Salva IT e traduci'}
              </Button>
              <Button onClick={() => void onSaveAllDirty()} disabled={busy || !isDirty}>
                <SaveIcon className="size-4" />
                {sp.isSaving ? 'Salvataggio…' : 'Salva tutte le lingue'}
              </Button>
            </>
          }
        />
      </div>

      {sp.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{sp.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Pubblicazione per lingua</CardTitle>
          <CardDescription>
            Ogni locale può essere salvato come bozza o pubblicato in modo indipendente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {SITE_LOCALES.map((locale) => {
            const draft = sp.localeDrafts[locale]
            const status = currentPageCatalog?.locales[locale]?.status
            return (
              <div key={locale} className="flex min-w-[140px] items-center gap-2 rounded-lg border px-3 py-2">
                <Switch
                  checked={draft?.published ?? true}
                  onCheckedChange={(checked) => setSiteLocalePublished(locale, checked)}
                />
                <div className="min-w-0">
                  <Label className="text-sm">{LOCALE_LABELS[locale]}</Label>
                  {status === 'missing' ? (
                    <p className="text-xs text-amber-700">Traduzione mancante</p>
                  ) : draft?.updatedAt ? (
                    <p className="text-xs text-muted-foreground">
                      {new Date(draft.updatedAt).toLocaleString('it-IT')}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Default server</p>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {sp.isLoading ? (
        <RouteSkeleton />
      ) : (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Stringhe e traduzioni</CardTitle>
                {isDirty ? <Badge variant="outline">Modifiche non salvate</Badge> : null}
              </div>
              <CardDescription>
                Ogni campo traducibile mostra IT, EN, ES, FR e DE nello stesso blocco.
                {currentMissingLocales.length > 0 ? (
                  <> Lingue da generare: {currentMissingLocales.join(', ')}.</>
                ) : null}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchInput
              placeholder="Cerca per etichetta o testo…"
              value={sp.fieldSearch}
              onChange={(e) => setSiteFieldSearch(e.target.value)}
              wrapperClassName="max-w-md"
            />
            <SiteContentMultiLocaleAccordionEditor
              pageKey={pageKey}
              draftsByLocale={draftsByLocale}
              onLocaleChange={updateLocaleDraftContent}
              searchQuery={sp.fieldSearch}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
