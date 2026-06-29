import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { ExternalLinkIcon, RefreshCwIcon, SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  deleteSeoRedirect,
  fetchSeoStatus,
  refreshSeoCaches,
  seoStore,
  upsertSeoRedirect,
} from '@/features/seo'
import { RoutePageHeader } from '@/components/route-page-header'
import { RouteSkeleton } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatWhen(iso: string | undefined | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('it-IT')
}

export function SeoPage() {
  const store = useSnapshot(seoStore)
  const [fromPath, setFromPath] = useState('')
  const [toPath, setToPath] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    void fetchSeoStatus()
  }, [])

  async function onRefresh() {
    try {
      await refreshSeoCaches()
      toast.success('Sitemap, feed Merchant e llms.txt rigenerati')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Rigenerazione fallita')
    }
  }

  async function onAddRedirect(e: React.FormEvent) {
    e.preventDefault()
    if (!fromPath.trim() || !toPath.trim()) return
    try {
      await upsertSeoRedirect({
        fromPath: fromPath.trim(),
        toPath: toPath.trim(),
        statusCode: 301,
        reason: reason.trim() || null,
      })
      setFromPath('')
      setToPath('')
      setReason('')
      toast.success('Redirect salvato')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Salvataggio fallito')
    }
  }

  async function onDeleteRedirect(path: string) {
    try {
      await deleteSeoRedirect(path)
      toast.success('Redirect eliminato')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Eliminazione fallita')
    }
  }

  if (store.isLoading && !store.status) {
    return <RouteSkeleton />
  }

  const urls = store.status?.publicUrls

  return (
    <div className="space-y-6">
      <RoutePageHeader description="Sitemap, feed Google Shopping, llms.txt e redirect 301. I file pubblici si rigenerano automaticamente ogni 6 ore; puoi forzare l'aggiornamento dopo modifiche al catalogo o alle guide." />

      {store.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sitemap XML</CardTitle>
            <CardDescription>Prodotti, categorie, brand e guide dal catalogo reale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Ultima generazione: {formatWhen(store.status?.sitemap?.builtAt)}</p>
            <p>URL in sitemap: {store.status?.sitemap?.urlCount ?? '—'}</p>
            {urls ? (
              <a href={urls.sitemap} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-600 hover:underline">
                Apri sitemap <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Merchant feed</CardTitle>
            <CardDescription>Feed prodotti per Google Merchant Center</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Ultima generazione: {formatWhen(store.status?.merchantFeed?.builtAt)}</p>
            <p>Prodotti nel feed: {store.status?.merchantFeed?.itemCount ?? '—'}</p>
            {urls ? (
              <a href={urls.merchantFeed} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-600 hover:underline">
                Apri feed <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">llms.txt</CardTitle>
            <CardDescription>Indice per crawler AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Ultima generazione: {formatWhen(store.status?.llms?.builtAt)}</p>
            {urls ? (
              <a href={urls.llms} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-600 hover:underline">
                Apri llms.txt <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Migrazione SEO da WordPress</CardTitle>
            <CardDescription>
              Storico export inviati dal plugin WordPress con URL, metadati Yoast, prodotti e redirect.
            </CardDescription>
          </div>
          <Button variant="outline" render={<Link to="/seo/migration" />}>
            Apri storico migrazioni
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Rigenerazione</CardTitle>
            <CardDescription>
              Aggiorna sitemap, feed e llms.txt dal catalogo Arfly e dalle guide pubblicate nel BO.
              Invalida anche la cache CMS della PWA se REVALIDATE_SECRET è configurato.
            </CardDescription>
          </div>
          <Button variant="success" onClick={() => void onRefresh()} disabled={store.isRefreshing}>
            <RefreshCwIcon className={store.isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {store.isRefreshing ? 'Rigenerazione…' : 'Rigenera ora'}
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redirect 301</CardTitle>
          <CardDescription>
            Percorsi interni (es. /vecchia-categoria/lampade → /categoria/lampade). Il middleware PWA applica il redirect automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={onAddRedirect} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="fromPath">Da (path)</Label>
              <Input id="fromPath" value={fromPath} onChange={(e) => setFromPath(e.target.value)} placeholder="/vecchio-path" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toPath">A (path)</Label>
              <Input id="toPath" value={toPath} onChange={(e) => setToPath(e.target.value)} placeholder="/nuovo-path" />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="reason">Motivo (opz.)</Label>
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Cambio slug categoria" />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Salva redirect</Button>
            </div>
          </form>

          {store.redirects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun redirect configurato.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Da</TableHead>
                    <TableHead>A</TableHead>
                    <TableHead>Codice</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store.redirects.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.fromPath}</TableCell>
                      <TableCell className="font-mono text-xs">{r.toPath}</TableCell>
                      <TableCell>{r.statusCode}</TableCell>
                      <TableCell className="text-muted-foreground">{r.reason ?? '—'}</TableCell>
                      <TableCell>
                        <Button type="button" variant="destructive" size="sm" onClick={() => void onDeleteRedirect(r.fromPath)}>
                          Elimina
                        </Button>
                      </TableCell>
                    </TableRow>
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
