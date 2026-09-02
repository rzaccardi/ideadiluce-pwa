import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { CopyIcon, ExternalLinkIcon, SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  saveMerchantCenterSettings,
  seoStore,
  validateMerchantFeedSample,
  type MerchantFeedIssue,
} from '@/features/seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DetailField } from '@/components/shared/detail-field'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ISSUE_LABELS: Record<MerchantFeedIssue, string> = {
  missing_image: 'Senza immagine',
  missing_gtin: 'Senza EAN/GTIN',
  zero_price: 'Prezzo a zero',
  missing_title: 'Senza titolo',
  noindex: 'Escluso (noindex)',
}

const AVAILABILITY_LABELS: Record<string, string> = {
  in_stock: 'Disponibile',
  out_of_stock: 'Esaurito',
  backorder: 'Su ordinazione',
}

function eurosFromCents(cents: number | null): string {
  if (cents == null) return ''
  return (cents / 100).toFixed(2)
}

function centsFromEuros(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) return null
  const amount = Number(trimmed)
  if (!Number.isFinite(amount) || amount < 0) return null
  return Math.round(amount * 100)
}

export function MerchantCenterPanel() {
  const store = useSnapshot(seoStore)
  const merchant = store.merchant
  const [shippingEuros, setShippingEuros] = useState('')
  const [category, setCategory] = useState('594')
  const [brandFallback, setBrandFallback] = useState('Idea di Luce')
  const [shippingCountry, setShippingCountry] = useState('IT')

  useEffect(() => {
    if (!merchant) return
    setShippingEuros(eurosFromCents(merchant.shippingPriceCents))
    setCategory(merchant.googleProductCategory)
    setBrandFallback(merchant.brandFallback)
    setShippingCountry(merchant.shippingCountry)
  }, [merchant])

  if (!merchant) return null
  const settings = merchant

  async function save(
    patch: Parameters<typeof saveMerchantCenterSettings>[0],
    message: string,
  ) {
    try {
      await saveMerchantCenterSettings(patch)
      toast.success(message)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Salvataggio fallito')
    }
  }

  async function copyFeedUrl() {
    try {
      await navigator.clipboard.writeText(settings.publicFeedUrl)
      toast.success('URL del feed copiato')
    } catch {
      toast.error('Impossibile copiare l’URL')
    }
  }

  async function persistShipping() {
    const shippingPriceCents = centsFromEuros(shippingEuros)
    const country = shippingCountry.trim().toUpperCase()
    if (country.length !== 2) {
      toast.error('Il paese spedizione deve essere un codice ISO a 2 lettere')
      return
    }
    if (
      shippingPriceCents === settings.shippingPriceCents &&
      country === settings.shippingCountry
    ) {
      return
    }
    await save({ shippingCountry: country, shippingPriceCents }, 'Spedizione nel feed aggiornata')
  }

  async function persistCategory() {
    const value = category.trim()
    if (value === settings.googleProductCategory) return
    await save({ googleProductCategory: value }, 'Categoria Google aggiornata')
  }

  async function persistBrand() {
    const value = brandFallback.trim()
    if (!value || value === settings.brandFallback) return
    await save({ brandFallback: value }, 'Brand di fallback aggiornato')
  }

  async function runValidate() {
    try {
      await validateMerchantFeedSample()
      toast.success('Campione feed controllato')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Controllo fallito')
    }
  }

  const issueCount = store.merchantSample.filter((row) => row.issues.length > 0).length

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Google Merchant Center</CardTitle>
            <CardDescription>
              Sostituisce il plugin Google for WooCommerce / Site Kit sul vecchio WordPress: il
              catalogo lo aggiorna il proxy, non Odoo e non WordPress. Stesso account Merchant
              Center, origine dati nuova.
            </CardDescription>
          </div>
          <Badge variant={merchant.enabled ? 'default' : 'secondary'}>
            {merchant.enabled ? 'Feed attivo' : 'Feed disattivo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Label htmlFor="merchant-enabled" className="flex min-w-0 flex-col gap-1">
            <span className="font-medium text-gray-900">Pubblica il feed</span>
            <span className="text-xs font-normal text-gray-500">
              Se disattivo il file resta raggiungibile ma senza prodotti, finché non lo riattivi e
              rigeneri.
            </span>
          </Label>
          <Switch
            id="merchant-enabled"
            checked={merchant.enabled}
            disabled={store.isSavingMerchant}
            onCheckedChange={(enabled) =>
              void save({ enabled }, enabled ? 'Feed Merchant attivo' : 'Feed Merchant disattivo')
            }
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-500">URL da inserire in Merchant Center (scheduled fetch)</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={merchant.publicFeedUrl} className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => void copyFeedUrl()}>
                <CopyIcon className="h-4 w-4" />
                Copia
              </Button>
              <Button type="button" variant="outline" onClick={() => window.open(merchant.publicFeedUrl, '_blank', 'noopener')}>
                Apri <ExternalLinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li>
            Entra nel{' '}
            <a
              href="https://merchants.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 hover:underline"
            >
              Merchant Center
            </a>{' '}
            già usato con WooCommerce (non crearne uno nuovo, se l’account è ancora valido).
          </li>
          <li>
            Origini dati: disattiva o elimina il canale del plugin WordPress (Content API / Google
            for WooCommerce). Lasciarlo attivo insieme a questo feed duplica i prodotti.
          </li>
          <li>
            Aggiungi prodotti da un file → fetch pianificato, URL copiato sopra, paese Italia,
            lingua italiano, almeno 1 volta al giorno. Il proxy rigenera il file ogni ora; da qui
            puoi forzare l’aggiornamento con «Rigenera ora».
          </li>
          <li>
            Verifica il dominio del nuovo shop se Google lo chiede. Spedizioni e resi restano nel
            pannello Google, come con il plugin.
          </li>
        </ol>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-3">
            <Label htmlFor="merchant-oos" className="flex min-w-0 flex-col gap-1">
              <span className="font-medium text-gray-900">Includi prodotti esauriti</span>
              <span className="text-xs font-normal text-gray-500">
                Restano nel feed come out of stock / su ordinazione
              </span>
            </Label>
            <Switch
              id="merchant-oos"
              checked={merchant.includeOutOfStock}
              disabled={store.isSavingMerchant}
              onCheckedChange={(includeOutOfStock) =>
                void save({ includeOutOfStock }, 'Filtro disponibilità aggiornato')
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-3">
            <Label htmlFor="merchant-variants" className="flex min-w-0 flex-col gap-1">
              <span className="font-medium text-gray-900">Una riga per variante</span>
              <span className="text-xs font-normal text-gray-500">
                Colore, wattaggio, attacco: id distinti e item group. Cambia gli id del feed, va
                ri-validato in Google.
              </span>
            </Label>
            <Switch
              id="merchant-variants"
              checked={merchant.expandVariants}
              disabled={store.isSavingMerchant}
              onCheckedChange={(expandVariants) =>
                void save({ expandVariants }, 'Espansione varianti aggiornata')
              }
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailField label="Categoria Google">
            <Input
              id="merchant-category"
              value={category}
              disabled={store.isSavingMerchant}
              onChange={(e) => setCategory(e.target.value)}
              onBlur={() => void persistCategory()}
              placeholder="594"
            />
            <p className="mt-1 text-xs text-gray-500">Default 594 = Home &amp; Garden &gt; Lighting</p>
          </DetailField>
          <DetailField label="Brand se manca sul prodotto">
            <Input
              id="merchant-brand"
              value={brandFallback}
              disabled={store.isSavingMerchant}
              onChange={(e) => setBrandFallback(e.target.value)}
              onBlur={() => void persistBrand()}
            />
          </DetailField>
          <DetailField label="Paese spedizione (ISO)">
            <Input
              id="merchant-ship-country"
              value={shippingCountry}
              disabled={store.isSavingMerchant}
              onChange={(e) => setShippingCountry(e.target.value.toUpperCase())}
              onBlur={() => void persistShipping()}
              maxLength={2}
            />
          </DetailField>
          <DetailField label="Costo spedizione nel feed (€)">
            <Input
              id="merchant-ship-price"
              inputMode="decimal"
              placeholder="Vuoto = solo in Google"
              value={shippingEuros}
              disabled={store.isSavingMerchant}
              onChange={(e) => setShippingEuros(e.target.value)}
              onBlur={() => void persistShipping()}
            />
            <p className="mt-1 text-xs text-gray-500">0,00 = spedizione gratuita. Lascia vuoto per gestirla solo in Merchant Center.</p>
          </DetailField>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Diagnostica campione</p>
            <p className="text-xs text-gray-500">
              Controlla i primi 20 prodotti del catalogo (prezzo, EAN, immagini) senza attendere Google.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void runValidate()}
            disabled={store.isValidatingMerchant}
          >
            <SearchIcon className={store.isValidatingMerchant ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
            {store.isValidatingMerchant ? 'Controllo…' : 'Controlla campione'}
          </Button>
        </div>

        {store.merchantSample.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              {store.merchantSample.length} righe · {issueCount} con avvisi
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Prodotto</TableHead>
                    <TableHead>Prezzo</TableHead>
                    <TableHead>Disponibilità</TableHead>
                    <TableHead>Nel feed</TableHead>
                    <TableHead>Avvisi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store.merchantSample.map((row) => (
                    <TableRow key={`${row.slug}-${row.id}`}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell className="min-w-0 truncate text-sm">{row.title}</TableCell>
                      <TableCell className="text-sm">{row.feedPrice} €</TableCell>
                      <TableCell className="text-sm">
                        {AVAILABILITY_LABELS[row.availability] ?? row.availability}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.included ? 'secondary' : 'outline'}>
                          {row.included ? 'Sì' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {row.issues.length
                          ? row.issues.map((issue) => ISSUE_LABELS[issue]).join(', ')
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
