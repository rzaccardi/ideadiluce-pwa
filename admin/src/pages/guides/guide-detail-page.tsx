import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { ArrowLeftIcon, ExternalLinkIcon, EyeOffIcon, EyeIcon, LanguagesIcon, SaveIcon, SparklesIcon } from 'lucide-react'
import {
  fetchGuideDetail,
  getGuideLabel,
  guidesStore,
  isSiteDraftDirty,
  publishGuide,
  saveGuideAllDirtyLocales,
  saveGuideContent,
  saveGuideLocalePublished,
  setGuideFieldSearch,
  SITE_LOCALES,
  siteStore,
  translateGuide,
  unpublishGuide,
  updateGuideMeta,
  updateLocaleDraftContent,
  type SiteLocale,
} from '@/features/guides'
import { GUIDE_CATEGORIES } from '@/types/guides'
import { SiteContentMultiLocaleAccordionEditor } from '@/components/site/site-content-multi-locale-accordion-editor'
import { DetailPageActionBar, RouteSkeleton, SearchInput, SitePageHeader } from '@/components/shared'
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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

const LOCALE_LABELS: Record<SiteLocale, string> = {
  IT: 'Italiano',
  EN: 'Inglese',
  ES: 'Spagnolo',
  FR: 'Francese',
  DE: 'Tedesco',
}

export function GuideDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const gs = useSnapshot(guidesStore)
  const sp = useSnapshot(siteStore)
  const guide = gs.current?.slug === slug ? gs.current : null
  const isDirty = isSiteDraftDirty()
  const pageKey = guide ? guide.pageKey : `guide-${slug}`
  const missingLocales =
    guide?.locales.filter((entry) => entry.locale !== 'IT' && !entry.hasCustomContent).map((e) => e.locale) ??
    []

  useEffect(() => {
    if (!slug) return
    void fetchGuideDetail(slug)
  }, [slug])

  if (!gs.isLoading && gs.error && !guide) {
    return <Navigate to="/guides" replace />
  }

  async function onMetaChange(
    patch: Partial<{
      category: string
      readingMeta: string
      sortOrder: number
      indexed: boolean
      featured: boolean
      published: boolean
    }>,
  ) {
    try {
      await updateGuideMeta(slug, patch)
      toast.success('Impostazioni guida aggiornate')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Aggiornamento fallito')
    }
  }

  async function onSaveItalian(translateAllLocales = false) {
    try {
      await saveGuideContent(slug, 'IT', { translateAllLocales })
      toast.success(
        translateAllLocales
          ? 'Guida salvata e tradotta in EN, ES, FR e DE'
          : 'Contenuti italiani salvati',
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Salvataggio fallito')
    }
  }

  async function onSaveAllDirty() {
    try {
      await saveGuideAllDirtyLocales(slug)
      toast.success('Tutte le modifiche salvate')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Salvataggio fallito')
    }
  }

  async function onPublish() {
    try {
      await publishGuide(slug)
      toast.success('Guida pubblicata sul sito')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Pubblicazione fallita')
    }
  }

  async function onUnpublish() {
    try {
      await unpublishGuide(slug)
      toast.success('Guida rimossa dalla pubblicazione')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Operazione fallita')
    }
  }

  async function onLocalePublishedChange(locale: SiteLocale, published: boolean) {
    try {
      await saveGuideLocalePublished(slug, locale, published)
      toast.success(published ? `${LOCALE_LABELS[locale]} pubblicato` : `${LOCALE_LABELS[locale]} in bozza`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Salvataggio fallito')
    }
  }

  async function onTranslateAll(onlyMissingLocales = false) {
    try {
      const result = await translateGuide(slug, onlyMissingLocales)
      const created = result.targetLocales.length
      if (onlyMissingLocales) {
        toast.success(
          created > 0 ? `Create ${created} traduzioni mancanti` : 'Nessuna traduzione mancante',
        )
      } else {
        toast.success(`Traduzione completata: ${result.targetLocales.join(', ')}`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Traduzione fallita')
    }
  }

  const busy = gs.isSaving || gs.isTranslating || gs.isLoading || sp.isSaving
  const draftsByLocale = Object.fromEntries(
    SITE_LOCALES.map((locale: SiteLocale) => [locale, sp.localeDrafts[locale]?.content ?? {}]),
  ) as Record<SiteLocale, Record<string, unknown>>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SitePageHeader
          title={guide?.locales.find((l) => l.locale === 'IT')?.title ?? getGuideLabel(slug)}
          description={`Slug: /guide/${slug} · ${guide?.published ? 'Online sul sito' : 'Bozza — non visibile ai visitatori'}.`}
        />
        <DetailPageActionBar
          stickyOnMobile
          secondary={
            <>
              <Button variant="outline" className="w-full lg:w-auto" render={<Link to="/guides" />}>
                <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                Elenco guide
              </Button>
              <Button
                variant="outline"
                className="w-full lg:w-auto"
                render={<a href={`/guide/${slug}`} target="_blank" rel="noreferrer" />}
              >
                <ExternalLinkIcon className="h-4 w-4" aria-hidden />
                Anteprima
              </Button>
            </>
          }
          primary={
            <>
              {guide?.published ? (
                <Button variant="outline" onClick={() => void onUnpublish()} disabled={busy}>
                  <EyeOffIcon className="size-4" />
                  Metti offline
                </Button>
              ) : (
                <Button variant="success" onClick={() => void onPublish()} disabled={busy}>
                  <EyeIcon className="size-4" />
                  Pubblica sul sito
                </Button>
              )}
              {missingLocales.length > 0 ? (
                <Button variant="outline" onClick={() => void onTranslateAll(true)} disabled={busy}>
                  <SparklesIcon className="size-4" />
                  Traduci mancanti
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => void onTranslateAll(false)} disabled={busy}>
                <LanguagesIcon className="size-4" />
                Rigenera traduzioni
              </Button>
              <Button variant="success" onClick={() => void onSaveItalian(true)} disabled={busy}>
                <SaveIcon className="size-4" />
                Salva IT e traduci
              </Button>
              <Button onClick={() => void onSaveAllDirty()} disabled={busy || !isDirty}>
                <SaveIcon className="size-4" />
                Salva tutte le lingue
              </Button>
            </>
          }
        />
      </div>

      {gs.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{gs.error}</AlertDescription>
        </Alert>
      ) : null}

      {gs.isLoading && !guide ? (
        <RouteSkeleton variant="detail" />
      ) : guide ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Indicizzazione e pubblicazione</CardTitle>
              <CardDescription>
                Controlla visibilità nell&apos;hub guide, in homepage e lo stato generale della guida.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={guide.category}
                  onValueChange={(value) => value && void onMetaChange({ category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GUIDE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tempo di lettura</Label>
                <Input
                  defaultValue={guide.readingMeta}
                  onBlur={(e) => void onMetaChange({ readingMeta: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ordine in elenco</Label>
                <Input
                  type="number"
                  min={0}
                  defaultValue={guide.sortOrder}
                  onBlur={(e) => void onMetaChange({ sortOrder: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 sm:col-span-2 lg:col-span-3">
                <Switch
                  checked={guide.published}
                  onCheckedChange={(checked) => void onMetaChange({ published: checked })}
                />
                <div>
                  <Label>Guida pubblicata sul sito</Label>
                  <p className="text-xs text-muted-foreground">
                    {guide.published
                      ? 'Visibile in /guide (se indicizzata) e raggiungibile per URL diretto'
                      : 'Non visibile ai visitatori'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Switch
                  checked={guide.indexed}
                  onCheckedChange={(checked) => void onMetaChange({ indexed: checked })}
                />
                <Label>Indicizzata in /guide</Label>
              </div>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Switch
                  checked={guide.featured}
                  onCheckedChange={(checked) => void onMetaChange({ featured: checked })}
                />
                <Label>In evidenza in homepage</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pubblicazione per lingua</CardTitle>
              <CardDescription>
                Ogni lingua può essere pubblicata in modo indipendente. Le modifiche vengono salvate
                subito.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {SITE_LOCALES.map((locale: SiteLocale) => {
                const draft = sp.localeDrafts[locale]
                const localeInfo = guide.locales.find((entry) => entry.locale === locale)
                const isPublished = draft?.published ?? localeInfo?.published ?? false
                return (
                  <div
                    key={locale}
                    className="flex min-w-[140px] items-center gap-2 rounded-lg border px-3 py-2"
                  >
                    <Switch
                      checked={isPublished}
                      disabled={busy}
                      onCheckedChange={(checked) => void onLocalePublishedChange(locale, checked)}
                    />
                    <div className="min-w-0">
                      <Label className="text-sm">{LOCALE_LABELS[locale]}</Label>
                      {!localeInfo?.hasCustomContent && locale !== 'IT' ? (
                        <p className="text-xs text-amber-700">Traduzione mancante</p>
                      ) : localeInfo?.updatedAt ? (
                        <p className="text-xs text-muted-foreground">
                          {new Date(localeInfo.updatedAt).toLocaleString('it-IT')}
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

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>Contenuto e traduzioni</CardTitle>
                {isDirty ? <Badge variant="outline">Modifiche non salvate</Badge> : null}
              </div>
              <CardDescription>
                Ogni stringa traducibile mostra IT, EN, ES, FR e DE nello stesso blocco.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchInput
                placeholder="Cerca per etichetta o testo…"
                value={gs.fieldSearch}
                onChange={(e) => setGuideFieldSearch(e.target.value)}
                wrapperClassName="max-w-md"
              />
              <SiteContentMultiLocaleAccordionEditor
                pageKey={pageKey}
                draftsByLocale={draftsByLocale}
                onLocaleChange={updateLocaleDraftContent}
                searchQuery={gs.fieldSearch}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
