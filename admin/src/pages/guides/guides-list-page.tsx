import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { BookOpenIcon, PlusIcon } from 'lucide-react'
import { createGuide, fetchGuidesList, guidesStore, setGuidePublished } from '@/features/guides'
import { RoutePageHeader } from '@/components/route-page-header'
import { ClickableTableRow, InfiniteScrollSentinel, RouteSkeleton } from '@/components/shared'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SITE_LOCALES } from '@/features/site/site.store'
import { GUIDE_CATEGORIES } from '@/types/guides'
import { toast } from 'sonner'
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel'

const PAGE_SIZE = 25

function slugifyGuideTitle(title: string) {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildListQuery(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  })
  return params.toString()
}

function CreateGuideCard({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const store = useSnapshot(guidesStore)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [category, setCategory] = useState<string>(GUIDE_CATEGORIES[0].value)
  const [readingMeta, setReadingMeta] = useState('5 min')

  useEffect(() => {
    if (!open) {
      setTitle('')
      setSlug('')
      setSlugTouched(false)
      setCategory(GUIDE_CATEGORIES[0].value)
      setReadingMeta('5 min')
    }
  }, [open])

  if (!open) return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast.error('Inserisci il titolo della guida')
      return
    }
    const resolvedSlug = (slugTouched ? slug : slugifyGuideTitle(trimmedTitle)).trim()
    if (!resolvedSlug) {
      toast.error('Inserisci uno slug valido (lettere, numeri e trattini)')
      return
    }
    try {
      const created = await createGuide({
        title: trimmedTitle,
        slug: resolvedSlug,
        category,
        readingMeta: readingMeta.trim() || undefined,
      })
      toast.success('Guida creata. Completa i contenuti e pubblicala quando è pronta.')
      onClose()
      navigate(`/guides/${encodeURIComponent(created.slug)}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Creazione fallita')
    }
  }

  const previewSlug = slugTouched ? slug : slugifyGuideTitle(title)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuova guida</CardTitle>
        <CardDescription>
          La guida viene creata come bozza. Dopo il salvataggio potrai scrivere i contenuti e
          pubblicarla.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => void onSubmit(e)}>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="new-guide-title">Titolo</Label>
            <Input
              id="new-guide-title"
              value={title}
              onChange={(e) => {
                const next = e.target.value
                setTitle(next)
                if (!slugTouched) setSlug(slugifyGuideTitle(next))
              }}
              placeholder="Es. Come scegliere un dimmer"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-guide-slug">Slug URL</Label>
            <Input
              id="new-guide-slug"
              value={slugTouched ? slug : previewSlug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value.toLowerCase())
              }}
              placeholder="come-scegliere-un-dimmer"
            />
            <p className="text-xs text-muted-foreground">
              /guide/{previewSlug || '…'}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(value) => value && setCategory(value)}>
              <SelectTrigger className="w-full">
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
            <Label htmlFor="new-guide-reading">Tempo di lettura</Label>
            <Input
              id="new-guide-reading"
              value={readingMeta}
              onChange={(e) => setReadingMeta(e.target.value)}
              placeholder="5 min"
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="cancel" onClick={onClose} disabled={store.isCreating}>
              Annulla
            </Button>
            <Button type="submit" variant="success" disabled={store.isCreating}>
              {store.isCreating ? 'Creazione…' : 'Crea guida'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function GuidesListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const store = useSnapshot(guidesStore)
  const [createOpen, setCreateOpen] = useState(false)
  const page = Number(searchParams.get('page') ?? '1')
  const listQuery = useMemo(() => buildListQuery(searchParams, page), [searchParams, page])
  const hasMore =
    store.list != null && store.list.hasNextPage && store.items.length > 0

  useEffect(() => {
    void fetchGuidesList(listQuery, { append: page > 1 })
  }, [listQuery, page])

  const loadMore = useCallback(() => {
    if (store.listLoading || store.listLoadingMore || !hasMore || !store.list) return
    const p = new URLSearchParams(searchParams)
    p.set('page', String(store.list.page + 1))
    setSearchParams(p, { replace: true })
  }, [hasMore, store.list, store.listLoading, store.listLoadingMore, searchParams, setSearchParams])

  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loading: store.listLoadingMore,
    onLoadMore: loadMore,
  })

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
      <RoutePageHeader
        description="Pubblica le guide sul sito con l'interruttore in elenco, oppure apri il dettaglio per contenuti, traduzioni e indicizzazione."
        actions={
          <Button onClick={() => setCreateOpen((open) => !open)}>
            <PlusIcon className="h-4 w-4" aria-hidden />
            Nuova guida
          </Button>
        }
      />

      <CreateGuideCard open={createOpen} onClose={() => setCreateOpen(false)} />

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
            Le singole guide si gestiscono qui (non in &quot;Pagine sito&quot;, dove c&apos;è solo
            la landing /guide). L&apos;interruttore <strong>Pubblicata</strong> rende la guida
            visibile sul sito. Per salvare testi e traduzioni apri il dettaglio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {store.listLoading && store.items.length === 0 ? (
            <RouteSkeleton />
          ) : store.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessuna guida in anagrafica. Crea la prima con &quot;Nuova guida&quot;.
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
              <InfiniteScrollSentinel ref={sentinelRef} hasMore={hasMore} loading={store.listLoadingMore} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
