import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { BookOpenIcon } from 'lucide-react'
import { fetchGuidesList, guidesStore, setGuidePublished } from '@/features/guides'
import { RoutePageHeader } from '@/components/route-page-header'
import { ClickableTableRow, RouteSkeleton } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SITE_LOCALES } from '@/features/site/site.store'
import { toast } from 'sonner'

export function GuidesListPage() {
  const store = useSnapshot(guidesStore)

  useEffect(() => {
    void fetchGuidesList()
  }, [])

  async function onTogglePublished(slug: string, published: boolean) {
    try {
      await setGuidePublished(slug, published)
      toast.success(published ? 'Guida pubblicata' : 'Guida rimossa dalla pubblicazione')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Aggiornamento fallito')
    }
  }

  const publishedCount = store.items.filter((g) => g.published).length

  return (
    <div className="space-y-6">
      <RoutePageHeader description="Pubblica le guide sul sito con l'interruttore in elenco, oppure apri il dettaglio per contenuti, traduzioni e indicizzazione." />

      {store.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Elenco guide</CardTitle>
            <Badge variant="outline">
              {publishedCount}/{store.items.length} online
            </Badge>
          </div>
          <CardDescription>
            Le singole guide si gestiscono qui (non in &quot;Contenuti sito&quot;, dove c&apos;è solo
            la landing /guide). L&apos;interruttore <strong>Pubblicata</strong> rende la guida
            visibile sul sito. Per salvare testi e traduzioni apri il dettaglio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {store.isLoading && store.items.length === 0 ? (
            <RouteSkeleton />
          ) : store.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessuna guida in anagrafica. Riavvia l&apos;API o ricarica: le guide di default
              vengono create automaticamente al primo accesso.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Guida</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="w-16 text-center">Ordine</TableHead>
                    <TableHead className="text-center">Indice</TableHead>
                    <TableHead className="text-center">Home</TableHead>
                    <TableHead className="min-w-[100px] text-center">Pubblicata</TableHead>
                    {SITE_LOCALES.map((locale) => (
                      <TableHead key={locale} className="w-12 text-center">
                        {locale}
                      </TableHead>
                    ))}
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store.items.map((guide) => (
                    <ClickableTableRow key={guide.slug} to={`/guides/${encodeURIComponent(guide.slug)}`}>
                      <TableCell className="font-medium">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate">{guide.title}</p>
                            {guide.published ? (
                              <Badge className="shrink-0">Online</Badge>
                            ) : (
                              <Badge variant="outline" className="shrink-0">
                                Bozza
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">/guide/{guide.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{guide.category || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{guide.sortOrder}</TableCell>
                      <TableCell className="text-center">
                        {guide.indexed ? (
                          <Badge variant="secondary">Sì</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {guide.featured ? (
                          <Badge variant="secondary">Sì</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className="flex justify-center"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <Switch
                            checked={guide.published}
                            disabled={store.isSaving}
                            aria-label={guide.published ? 'Rimuovi dalla pubblicazione' : 'Pubblica guida'}
                            onCheckedChange={(checked) => void onTogglePublished(guide.slug, checked)}
                          />
                        </div>
                      </TableCell>
                      {SITE_LOCALES.map((locale) => {
                        const localeInfo = guide.locales[locale]
                        return (
                          <TableCell key={locale} className="text-center">
                            {localeInfo?.status === 'missing' ? (
                              <span className="text-xs text-amber-700">—</span>
                            ) : localeInfo?.published ? (
                              <span className="text-xs text-emerald-700" title="Pubblicata">
                                ✓
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground" title="Bozza">
                                ○
                              </span>
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell>
                        <Link
                          to={`/guides/${encodeURIComponent(guide.slug)}`}
                          className="inline-flex text-muted-foreground hover:text-foreground"
                          aria-label={`Apri ${guide.title}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <BookOpenIcon className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    </ClickableTableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
