import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  fetchSitePagesList,
  refreshSiteTranslationOverview,
  siteStore,
  translateAllMissingSitePages,
} from '@/features/site'
import { SiteI18nCoveragePanel } from '@/components/site/site-i18n-coverage-panel'
import { RoutePageHeader } from '@/components/route-page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

export function SitePagesListPage() {
  const sp = useSnapshot(siteStore)

  useEffect(() => {
    void fetchSitePagesList()
    void refreshSiteTranslationOverview()
  }, [])

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

  const busy = sp.isSaving || sp.isTranslating || sp.isBulkTranslating || sp.isLoading

  return (
    <div className="space-y-6">
      <RoutePageHeader description="Testi editoriali del sito PWA. Apri una pagina per modificare tutte le lingue insieme e genera le traduzioni mancanti con DeepL." />

      {sp.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{sp.error}</AlertDescription>
        </Alert>
      ) : null}

      <SiteI18nCoveragePanel
        catalog={sp.catalog}
        i18nStatus={sp.i18nStatus}
        busy={busy}
        onTranslateAllMissing={() => void onTranslateAllMissingSite()}
      />
    </div>
  )
}
