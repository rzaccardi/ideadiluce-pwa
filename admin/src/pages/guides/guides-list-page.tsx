import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { BookOpenIcon } from 'lucide-react'
import { fetchGuidesList, guidesStore } from '@/features/guides'
import { RoutePageHeader } from '@/components/route-page-header'
import { ClickableTableRow, RouteSkeleton } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SITE_LOCALES } from '@/features/site/site.store'

export function GuidesListPage() {
  const store = useSnapshot(guidesStore)

  useEffect(() => {
    void fetchGuidesList()
  }, [])

  return (
    <div className="space-y-6">
      <RoutePageHeader description="Gestisci le guide editoriali come entità singole: pubblicazione, traduzioni IT/EN/ES/FR/DE e indicizzazione nel catalogo guide e in homepage." />

      {store.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Guide pubblicate</CardTitle>
          <CardDescription>
            Ordine, categoria e visibilità controllano l&apos;hub /guide e le card in homepage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {store.isLoading && store.items.length === 0 ? (
            <RouteSkeleton />
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
                    <TableHead className="text-center">Pubblicata</TableHead>
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
                          <p className="truncate">{guide.title}</p>
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
                        {guide.published ? (
                          <Badge variant="default">Sì</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      {SITE_LOCALES.map((locale) => {
                        const status = guide.locales[locale]?.status
                        return (
                          <TableCell key={locale} className="text-center">
                            {status === 'missing' ? (
                              <span className="text-xs text-amber-700">—</span>
                            ) : (
                              <span className="text-xs text-emerald-700">✓</span>
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
