import { LanguagesIcon, SparklesIcon } from 'lucide-react'
import type { SiteCatalog, SiteI18nStatus } from '@/types/site'
import { SITE_LOCALES, type SiteLocale } from '@/features/site/site.store'
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
import { cn } from '@/lib/utils'

const LOCALE_LABELS: Record<SiteLocale, string> = {
  IT: 'IT',
  EN: 'EN',
  ES: 'ES',
  FR: 'FR',
  DE: 'DE',
}

type SiteI18nCoveragePanelProps = {
  catalog: SiteCatalog | null
  i18nStatus: SiteI18nStatus | null
  currentPageKey: string
  busy?: boolean
  onTranslateAllMissing: () => void
  onTranslateCurrentPageMissing: () => void
  onSelectPage: (pageKey: string) => void
}

function LocaleStatusDot({
  status,
  published,
}: {
  status: 'saved' | 'missing' | 'default'
  published: boolean
}) {
  if (status === 'missing') {
    return (
      <span
        className="inline-block size-2.5 rounded-full bg-amber-400 ring-2 ring-amber-100"
        title="Traduzione mancante"
      />
    )
  }

  if (status === 'default') {
    return (
      <span
        className="inline-block size-2.5 rounded-full bg-gray-300 ring-2 ring-gray-100"
        title="Default server (non salvato)"
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-block size-2.5 rounded-full ring-2',
        published ? 'bg-emerald-500 ring-emerald-100' : 'bg-sky-400 ring-sky-100',
      )}
      title={published ? 'Traduzione salvata e pubblicata' : 'Traduzione salvata (bozza)'}
    />
  )
}

export function SiteI18nCoveragePanel({
  catalog,
  i18nStatus,
  currentPageKey,
  busy = false,
  onTranslateAllMissing,
  onTranslateCurrentPageMissing,
  onSelectPage,
}: SiteI18nCoveragePanelProps) {
  const deeplReady = i18nStatus?.deepl.ready ?? false
  const missingTotal = catalog?.summary.missingTranslations ?? 0
  const currentPage = catalog?.pages.find((page) => page.pageKey === currentPageKey)
  const currentMissing = currentPage?.missingCount ?? 0
  const targetLocales = catalog?.targetLocales ?? SITE_LOCALES.filter((locale) => locale !== 'IT')

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Copertura traduzioni</CardTitle>
          <CardDescription>
            Ogni pagina editoriali ha versioni IT, EN, ES, FR e DE. Le celle ambra indicano lingue
            ancora da generare con DeepL partendo dall&apos;italiano salvato.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentMissing > 0 ? (
            <Button variant="outline" size="sm" disabled={busy || !deeplReady} onClick={onTranslateCurrentPageMissing}>
              <LanguagesIcon className="size-4" />
              Traduci mancanti ({currentMissing})
            </Button>
          ) : null}
          {missingTotal > 0 ? (
            <Button variant="success" size="sm" disabled={busy || !deeplReady} onClick={onTranslateAllMissing}>
              <SparklesIcon className="size-4" />
              Traduci tutto il sito ({missingTotal})
            </Button>
          ) : (
            <Badge variant="secondary">Tutte le lingue complete</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!deeplReady ? (
          <p className="text-sm text-amber-700">
            DeepL non è configurato sul server — puoi modificare i testi manualmente, ma la traduzione
            automatica non è disponibile.
          </p>
        ) : null}

        {catalog ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {catalog.summary.completePages}/{catalog.summary.totalPages} pagine complete
              </Badge>
              {targetLocales.map((locale) => (
                <Badge key={locale} variant="outline">
                  {LOCALE_LABELS[locale]}: {catalog.summary.byLocale[locale] ?? 0} mancanti
                </Badge>
              ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Pagina</TableHead>
                    {SITE_LOCALES.map((locale) => (
                      <TableHead key={locale} className="w-12 text-center">
                        {LOCALE_LABELS[locale]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalog.pages.map((page) => (
                    <TableRow
                      key={page.pageKey}
                      className={cn(
                        'cursor-pointer',
                        page.pageKey === currentPageKey && 'bg-sky-50/80',
                      )}
                      onClick={() => onSelectPage(page.pageKey)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{page.label}</span>
                          {page.missingCount > 0 ? (
                            <Badge variant="outline" className="font-normal text-amber-700">
                              {page.missingCount}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      {SITE_LOCALES.map((locale) => {
                        const localeStatus = page.locales[locale]
                        return (
                          <TableCell key={locale} className="text-center">
                            <div className="flex justify-center">
                              <LocaleStatusDot
                                status={localeStatus.status}
                                published={localeStatus.published}
                              />
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              Verde = salvata · Ambra = mancante · Grigio = IT non ancora salvato (usa i default) ·
              Clicca una riga per aprire la pagina.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Caricamento copertura traduzioni…</p>
        )}
      </CardContent>
    </Card>
  )
}
