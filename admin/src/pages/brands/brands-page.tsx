'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { ImagePlusIcon, MoonIcon, SunIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import {
  clearBrandLogos,
  deleteBrandLogo,
  fetchBrands,
  seedStaticBrandLogos,
  uploadBrandLogo,
  brandsStore,
} from '@/features/brands'
import type { AdminBrandRow } from '@/types/brands'
import { RoutePageHeader } from '@/components/route-page-header'
import { AdminPageLoadTransition, RouteSkeleton, SearchInput, TableFilters } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type LogoFilter = 'all' | 'with' | 'without'

function LogoSlot({
  brand,
  variant,
  busy,
}: {
  brand: AdminBrandRow
  variant: 'light' | 'dark'
  busy: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const url = variant === 'light' ? brand.logoLightUrl : brand.logoDarkUrl
  const label = variant === 'light' ? 'Light' : 'Dark'
  const Icon = variant === 'light' ? SunIcon : MoonIcon

  async function onFile(file: File | undefined) {
    if (!file) return
    try {
      await uploadBrandLogo(brand.slug, variant, file)
      toast.success(`Logo ${label.toLowerCase()} aggiornato`)
    } catch (e) {
      toast.error(String(e))
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex min-w-[9.5rem] flex-col gap-2">
      <div
        className={cn(
          'flex h-14 items-center justify-center overflow-hidden rounded-md border border-gray-200',
          variant === 'dark' ? 'bg-gray-900' : 'bg-white',
        )}
      >
        {url ? (
          <img
            src={url}
            alt={`Logo ${brand.name} ${label}`}
            className="max-h-10 max-w-[8rem] object-contain"
          />
        ) : (
          <span className="px-2 text-center text-xs text-gray-400">{brand.name}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          disabled={busy}
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 flex-1"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          <ImagePlusIcon className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Carica logo {label}</span>
          {label}
        </Button>
        {url ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            disabled={busy}
            aria-label={`Elimina logo ${label}`}
            onClick={() => {
              void deleteBrandLogo(brand.slug, variant)
                .then(() => toast.success(`Logo ${label.toLowerCase()} rimosso`))
                .catch((e) => toast.error(String(e)))
            }}
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function BrandsPage() {
  const store = useSnapshot(brandsStore)
  const [q, setQ] = useState('')
  const [logoFilter, setLogoFilter] = useState<LogoFilter>('all')

  useEffect(() => {
    void fetchBrands()
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return store.items.filter((item) => {
      if (query) {
        const hay = `${item.name} ${item.slug}`.toLowerCase()
        if (!hay.includes(query)) return false
      }
      const hasLogo = Boolean(item.logoLightUrl || item.logoDarkUrl)
      if (logoFilter === 'with' && !hasLogo) return false
      if (logoFilter === 'without' && hasLogo) return false
      return true
    })
  }, [store.items, q, logoFilter])

  const withLogoCount = store.items.filter((i) => i.logoLightUrl || i.logoDarkUrl).length

  return (
    <AdminPageLoadTransition
      isLoading={store.isLoading && store.items.length === 0}
      skeleton={<RouteSkeleton variant="list" />}
      loadingHeader={<RoutePageHeader />}
    >
      <div className="space-y-6">
        <RoutePageHeader
          description={`${store.items.length} marchi da Odoo · ${withLogoCount} con logo · senza logo resta il nome testuale in negozio`}
        />

        {store.error ? (
          <Alert variant="destructive">
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{store.error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm text-muted-foreground">
                I marchi arrivano solo da Odoo. I JPG in <code className="text-xs">client/public/brands</code>{' '}
                sono già usati come logo light; puoi caricare light/dark nuovi (Spaces) senza creare brand.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  void seedStaticBrandLogos()
                    .then((r) =>
                      toast.success(
                        r.upserted > 0
                          ? `Registrati ${r.upserted} loghi statici`
                          : 'Nessun logo statico da registrare (già presenti o sostituiti)',
                      ),
                    )
                    .catch((e) => toast.error(String(e)))
                }}
              >
                Importa loghi da /public/brands
              </Button>
            </div>

            <TableFilters
              search={
                <SearchInput
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cerca per nome o slug…"
                  aria-label="Cerca marchi"
                />
              }
              filters={
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'all', label: 'Tutti' },
                      { id: 'with', label: 'Con logo' },
                      { id: 'without', label: 'Senza logo' },
                    ] as const
                  ).map((opt) => (
                    <Button
                      key={opt.id}
                      type="button"
                      size="sm"
                      variant={logoFilter === opt.id ? 'default' : 'outline'}
                      onClick={() => setLogoFilter(opt.id)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              }
              onReset={() => {
                setQ('')
                setLogoFilter('all')
              }}
            />

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marchio (Odoo)</TableHead>
                    <TableHead className="text-right">Prodotti</TableHead>
                    <TableHead>Logo light</TableHead>
                    <TableHead>Logo dark</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        Nessun marchio trovato
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((brand) => {
                      const busy = store.busySlug === brand.slug
                      return (
                        <TableRow key={brand.slug}>
                          <TableCell className="min-w-[10rem]">
                            <div className="font-medium text-gray-900">{brand.name}</div>
                            <div className="text-xs text-muted-foreground">{brand.slug}</div>
                            {brand.logoLightSource === 'static' ? (
                              <div className="mt-1 text-[11px] text-muted-foreground">Logo statico</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {brand.productCount}
                          </TableCell>
                          <TableCell>
                            <LogoSlot brand={brand} variant="light" busy={busy} />
                          </TableCell>
                          <TableCell>
                            <LogoSlot brand={brand} variant="dark" busy={busy} />
                          </TableCell>
                          <TableCell className="text-right">
                            {brand.logoLightSource === 'managed' || brand.logoDarkUrl ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    !window.confirm(
                                      `Rimuovere i loghi caricati di «${brand.name}»? Restano eventuali JPG statici in /public/brands.`,
                                    )
                                  ) {
                                    return
                                  }
                                  void clearBrandLogos(brand.slug)
                                    .then(() => toast.success('Loghi caricati rimossi'))
                                    .catch((e) => toast.error(String(e)))
                                }}
                              >
                                Rimuovi loghi
                              </Button>
                            ) : brand.logoLightSource === 'static' ? (
                              <span className="text-xs italic text-gray-400">Statico</span>
                            ) : (
                              <span className="text-xs italic text-gray-400">Nome testuale</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageLoadTransition>
  )
}
