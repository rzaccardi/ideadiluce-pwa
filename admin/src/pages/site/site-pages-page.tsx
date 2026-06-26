import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { LanguagesIcon, SaveIcon, SparklesIcon } from 'lucide-react'
import {
  fetchSitePage,
  fetchSitePagesList,
  isSiteDraftDirty,
  refreshSiteTranslationOverview,
  saveSitePage,
  setSiteFieldSearch,
  SITE_LOCALES,
  SITE_PAGE_OPTIONS,
  siteStore,
  translateAllMissingSitePages,
  translateSitePage,
  updateDraftContent,
  updateDraftJson,
  type SiteLocale,
} from '@/features/site'
import { SiteContentAccordionEditor } from '@/components/site/site-content-accordion-editor'
import { SiteI18nCoveragePanel } from '@/components/site/site-i18n-coverage-panel'
import { RoutePageHeader } from '@/components/route-page-header'
import { RouteSkeleton, SearchInput } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
  const isDirty = isSiteDraftDirty()
  const currentPageCatalog = sp.catalog?.pages.find((page) => page.pageKey === sp.pageKey)
  const currentMissingLocales = currentPageCatalog?.missingLocales ?? []

  useEffect(() => {
    void fetchSitePagesList()
    void fetchSitePage(sp.pageKey, sp.locale)
    void refreshSiteTranslationOverview()
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

  async function onTranslateAll(onlyMissingLocales = false) {
    try {
      const result = await translateSitePage(sp.pageKey, { onlyMissingLocales })
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

  async function onTranslateAllMissingSite() {
    try {
      const result = await translateAllMissingSitePages()
      toast.success(
        result.translatedCount > 0
          ? `Generate ${result.translatedCount} traduzioni mancanti su ${result.pageKeys.length} pagine`
          : 'Tutte le traduzioni erano già presenti',
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Traduzione batch fallita')
    }
  }

  const isItalian = sp.locale === 'IT'
  const busy = sp.isSaving || sp.isTranslating || sp.isBulkTranslating || sp.isLoading
  const viewingMissingLocale =
    !isItalian && currentPageCatalog?.locales[sp.locale]?.status === 'missing'

  return (
    <div className="space-y-6">
      <RoutePageHeader description="Testi editoriali del sito PWA (header, homepage, landing). Modifica in italiano e genera in blocco le traduzioni mancanti con DeepL." />

      {sp.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{sp.error}</AlertDescription>
        </Alert>
      ) : null}

      <SiteI18nCoveragePanel
        catalog={sp.catalog}
        i18nStatus={sp.i18nStatus}
        currentPageKey={sp.pageKey}
        busy={busy}
        onTranslateAllMissing={() => void onTranslateAllMissingSite()}
        onTranslateCurrentPageMissing={() => void onTranslateAll(true)}
        onSelectPage={(pageKey) => void onPageKeyChange(pageKey)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Pagina e lingua</CardTitle>
          <CardDescription>
            L&apos;italiano è la sorgente per DeepL. Le altre lingue si possono generare in blocco
            senza riscrivere quelle già salvate.
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
                {SITE_PAGE_OPTIONS.map((p) => {
                  const catalogPage = sp.catalog?.pages.find((page) => page.pageKey === p.key)
                  return (
                    <SelectItem key={p.key} value={p.key}>
                      <span className="flex items-center gap-2">
                        {p.label}
                        {catalogPage && catalogPage.missingCount > 0 ? (
                          <span className="text-xs text-amber-600">({catalogPage.missingCount})</span>
                        ) : null}
                      </span>
                    </SelectItem>
                  )
                })}
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
                {SITE_LOCALES.map((loc) => {
                  const status = currentPageCatalog?.locales[loc]?.status
                  return (
                    <SelectItem key={loc} value={loc}>
                      <span className="flex items-center gap-2">
                        {LOCALE_LABELS[loc]}
                        {status === 'missing' ? (
                          <span className="text-xs text-amber-600">mancante</span>
                        ) : null}
                      </span>
                    </SelectItem>
                  )
                })}
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
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Contenuti</CardTitle>
                {isDirty ? <Badge variant="outline">Modifiche non salvate</Badge> : null}
                {viewingMissingLocale ? (
                  <Badge variant="outline" className="text-amber-700">
                    Traduzione non ancora generata
                  </Badge>
                ) : null}
              </div>
              <CardDescription>
                {sp.current?.updatedAt
                  ? `Ultimo aggiornamento: ${new Date(sp.current.updatedAt).toLocaleString('it-IT')}`
                  : 'Nessuna revisione salvata — verranno usati i default del server.'}
                {currentMissingLocales.length > 0 && isItalian ? (
                  <>
                    {' '}
                    · Lingue da generare: {currentMissingLocales.join(', ')}
                  </>
                ) : null}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isItalian ? (
                <>
                  {currentMissingLocales.length > 0 ? (
                    <Button
                      variant="outline"
                      onClick={() => void onTranslateAll(true)}
                      disabled={busy}
                    >
                      <SparklesIcon className="size-4" />
                      {sp.isTranslating ? 'Traduzione…' : 'Traduci solo mancanti'}
                    </Button>
                  ) : null}
                  <Button variant="outline" onClick={() => void onTranslateAll(false)} disabled={busy}>
                    <LanguagesIcon className="size-4" />
                    {sp.isTranslating ? 'Traduzione…' : 'Rigenera tutte le lingue'}
                  </Button>
                  <Button variant="success" onClick={() => void onSave(true)} disabled={busy}>
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
          <CardContent className="space-y-4">
            {!sp.showAdvancedJson ? (
              <SearchInput
                placeholder="Cerca per etichetta o testo…"
                value={sp.fieldSearch}
                onChange={(e) => setSiteFieldSearch(e.target.value)}
                wrapperClassName="max-w-md"
              />
            ) : null}
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
                searchQuery={sp.fieldSearch}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
