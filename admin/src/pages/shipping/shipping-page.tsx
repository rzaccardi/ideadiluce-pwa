import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import {
  fetchShipping,
  saveShippingCredential,
  saveShippingSurcharges,
  shippingStore,
  simulateShipping,
} from '@/features/shipping'
import { RoutePageHeader } from '@/components/route-page-header'
import { AdminPageLoadTransition, RouteSkeleton } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DetailField } from '@/components/shared/detail-field'

const FIELD_LABELS: Record<string, string> = {
  firstName: 'Nome',
  lastName: 'Cognome',
  line1: 'Indirizzo',
  streetNumber: 'Civico',
  city: 'Città',
  postalCode: 'CAP',
  country: 'Paese',
}

export function ShippingPage() {
  const shipping = useSnapshot(shippingStore)

  const [simAddress, setSimAddress] = useState({
    firstName: 'Mario',
    lastName: 'Rossi',
    line1: 'Via Roma',
    streetNumber: '1',
    isSnc: false,
    city: 'Milano',
    postalCode: '20100',
    country: 'IT',
  })
  const [surchargeForm, setSurchargeForm] = useState({
    dhlBaseCents: 500,
    fedexBaseCents: 400,
    dhlLengthCents: 1200,
    lengthThresholdMeters: 1,
  })

  useEffect(() => {
    void fetchShipping()
  }, [])

  useEffect(() => {
    if (shipping.surcharges) {
      setSurchargeForm({
        dhlBaseCents: shipping.surcharges.dhlBaseCents,
        fedexBaseCents: shipping.surcharges.fedexBaseCents,
        dhlLengthCents: shipping.surcharges.dhlLengthCents,
        lengthThresholdMeters: shipping.surcharges.lengthThresholdMeters,
      })
    }
  }, [shipping.surcharges])

  async function saveCredential(provider: 'DHL' | 'FEDEX', form: HTMLFormElement) {
    const fd = new FormData(form)
    await saveShippingCredential(provider, {
      provider,
      enabled: fd.get('enabled') === 'on',
      sandbox: fd.get('sandbox') === 'on',
      accountId: fd.get('accountId') || null,
      apiKey: fd.get('apiKey') || null,
      apiSecret: fd.get('apiSecret') || null,
    })
  }

  return (
    <AdminPageLoadTransition
      isLoading={shipping.isLoading && shipping.surcharges === null}
      skeleton={<RouteSkeleton variant="form" />}
      loadingHeader={<RoutePageHeader />}
    >
    <div className="space-y-6">
      <RoutePageHeader
        description={`${shipping.zones.length} zone · ${shipping.credentials.filter((c) => c.enabled).length} corrieri attivi`}
      />

      {shipping.error ? (
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{shipping.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="zones">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="zones">Zone</TabsTrigger>
              <TabsTrigger value="surcharges">Supplementi</TabsTrigger>
              <TabsTrigger value="carriers">Corrieri</TabsTrigger>
              <TabsTrigger value="simulate">Simulatore</TabsTrigger>
            </TabsList>

            <TabsContent value="zones" className="mt-4 flex flex-col gap-4">
              {shipping.zones.map((z) => (
                <Card key={z.id} className="border-dashed shadow-none">
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-lg sm:text-xl">
                      {z.name}
                      <Badge variant="secondary">{z.countries.join(', ')}</Badge>
                      {!z.enabled ? <Badge variant="outline">Disabilitata</Badge> : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col gap-2 text-sm text-gray-700">
                      {z.methods.map((m) => (
                        <li key={m.id} className="flex flex-wrap items-center gap-2">
                          <strong className="text-gray-900">{m.name}</strong>
                          <Badge variant="outline">{m.type}</Badge>
                          {m.flatAmountCents != null ? (
                            <span>€{(m.flatAmountCents / 100).toFixed(2)}</span>
                          ) : null}
                          {m.freeAboveCents != null ? (
                            <span className="text-gray-500">
                              gratis sopra €{(m.freeAboveCents / 100).toFixed(0)}
                            </span>
                          ) : null}
                          {m.surchargePct ? <span>+{m.surchargePct}%</span> : null}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="surcharges" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Supplementi corriere</CardTitle>
                  <CardDescription>
                    Importi fissi per ordine. Con spedizione gratuita attiva (sopra soglia) i supplementi non
                    vengono applicati.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid max-w-md gap-4 sm:grid-cols-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void saveShippingSurcharges({
                        dhlBaseCents: surchargeForm.dhlBaseCents,
                        fedexBaseCents: surchargeForm.fedexBaseCents,
                        dhlLengthCents: surchargeForm.dhlLengthCents,
                        lengthThresholdMeters: surchargeForm.lengthThresholdMeters,
                      })
                    }}
                  >
                    <DetailField label="DHL base (cent)">
                      <Input
                        type="number"
                        min={0}
                        value={surchargeForm.dhlBaseCents}
                        onChange={(e) =>
                          setSurchargeForm({ ...surchargeForm, dhlBaseCents: Number(e.target.value) })
                        }
                      />
                    </DetailField>
                    <DetailField label="FedEx base (cent)">
                      <Input
                        type="number"
                        min={0}
                        value={surchargeForm.fedexBaseCents}
                        onChange={(e) =>
                          setSurchargeForm({ ...surchargeForm, fedexBaseCents: Number(e.target.value) })
                        }
                      />
                    </DetailField>
                    <DetailField label="DHL lunghezza (cent)">
                      <Input
                        type="number"
                        min={0}
                        value={surchargeForm.dhlLengthCents}
                        onChange={(e) =>
                          setSurchargeForm({ ...surchargeForm, dhlLengthCents: Number(e.target.value) })
                        }
                      />
                    </DetailField>
                    <DetailField label="Soglia lunghezza (m)">
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={surchargeForm.lengthThresholdMeters}
                        onChange={(e) =>
                          setSurchargeForm({
                            ...surchargeForm,
                            lengthThresholdMeters: Number(e.target.value),
                          })
                        }
                      />
                    </DetailField>
                    <div className="sm:col-span-2 text-xs text-gray-500">
                      Default: DHL +5€, FedEx +4€, DHL +12€ se almeno un prodotto supera 1 m (solo DHL).
                    </div>
                    <Button
                      type="submit"
                      variant="success"
                      className="w-fit sm:col-span-2"
                      disabled={shipping.isSavingSurcharges}
                    >
                      {shipping.isSavingSurcharges ? 'Salvataggio…' : 'Salva supplementi'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="carriers" className="mt-4 flex flex-col gap-4">
              {shipping.credentials.map((c) => (
                <Card key={c.provider}>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">{c.provider}</CardTitle>
                    <CardDescription>
                      {c.hasKey ? 'API key configurata' : 'Nessuna API key'} ·{' '}
                      {c.hasSecret ? 'secret configurato' : 'nessun secret'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form
                      className="flex max-w-md flex-col gap-4"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void saveCredential(c.provider as 'DHL' | 'FEDEX', e.currentTarget)
                      }}
                    >
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" name="enabled" defaultChecked={c.enabled} />
                          Abilitato
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" name="sandbox" defaultChecked={c.sandbox} />
                          Sandbox
                        </label>
                      </div>
                      <DetailField label="Account number">
                        <Input
                          name="accountId"
                          placeholder="Account number"
                          defaultValue={c.accountId ?? ''}
                        />
                      </DetailField>
                      <DetailField label="API key">
                        <Input
                          name="apiKey"
                          placeholder={c.hasKey ? 'API key (vuoto = non cambiare)' : 'API key'}
                        />
                      </DetailField>
                      <DetailField label="API secret">
                        <Input
                          name="apiSecret"
                          type="password"
                          autoComplete="new-password"
                          placeholder={
                            c.hasSecret ? 'Secret (vuoto = non cambiare)' : 'API secret'
                          }
                        />
                      </DetailField>
                      <Button type="submit" variant="success" className="w-fit">
                        Salva
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="simulate" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Simulatore preventivo</CardTitle>
                  <CardDescription>
                    Richiede sessione PWA attiva sullo stesso browser (cookie) per test end-to-end.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid max-w-md gap-4 sm:grid-cols-2">
                    {(
                      [
                        'firstName',
                        'lastName',
                        'line1',
                        'streetNumber',
                        'city',
                        'postalCode',
                        'country',
                      ] as const
                    ).map((k) => (
                      <DetailField key={k} label={FIELD_LABELS[k] ?? k}>
                        <Input
                          id={k}
                          value={simAddress[k]}
                          onChange={(e) => setSimAddress({ ...simAddress, [k]: e.target.value })}
                        />
                      </DetailField>
                    ))}
                  </div>
                  <Button
                    type="button"
                    className="w-fit"
                    disabled={shipping.isSimulating}
                    onClick={() => void simulateShipping(simAddress)}
                  >
                    {shipping.isSimulating ? 'Simulazione…' : 'Simula preventivo'}
                  </Button>
                  {shipping.simQuotes.length ? (
                    <ul className="text-sm text-gray-700">
                      {shipping.simQuotes.map((q, i) => (
                        <li key={i}>
                          {q.label}: €{(q.amountCents / 100).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
    </AdminPageLoadTransition>
  )
}
