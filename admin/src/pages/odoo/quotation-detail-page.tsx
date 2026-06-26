import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { ArrowLeftIcon } from 'lucide-react'
import { OdooSaleOrderLink } from '@/components/orders/odoo-sale-order-link'
import { OdooHubProductLink } from '@/components/orders/odoo-hub-product-link'
import { OdooPartnerLink } from '@/components/odoo/odoo-partner-link'
import {
  DetailField,
  DetailPageActionBar,
  DetailValue,
  RouteSkeleton,
  SitePageHeader,
} from '@/components/shared'
import {
  fetchOdooQuotationDetailIntoStore,
  odooStore,
  resetOdooQuotationDetail,
} from '@/features/odoo'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { formatDate, formatMoney } from '@/lib/format'
import { quotationStateLabel } from '@/lib/quotation-state'

export function OdooQuotationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const quotationId = Number(id)
  const store = useSnapshot(odooStore)

  useEffect(() => {
    if (!Number.isInteger(quotationId) || quotationId <= 0) return
    void fetchOdooQuotationDetailIntoStore(quotationId)
    return () => {
      resetOdooQuotationDetail()
    }
  }, [quotationId])

  if (
    store.quotationDetailLoading ||
    (store.quotationDetailId === quotationId && !store.quotationDetail && !store.quotationDetailError)
  ) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio preventivo Odoo" />
        <RouteSkeleton variant="detail" />
      </div>
    )
  }

  if (store.quotationDetailError && store.quotationDetailId === quotationId && !store.quotationDetail) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio preventivo Odoo" />
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.quotationDetailError}</AlertDescription>
        </Alert>
        <Button variant="outline" render={<Link to="/odoo/quotations" />}>
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Torna all&apos;elenco
        </Button>
      </div>
    )
  }

  const quotation = store.quotationDetail
  if (!quotation || quotation.id !== quotationId) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SitePageHeader
          title={quotation.name}
          description={`${quotationStateLabel(quotation.state)} · ${formatDate(quotation.dateOrder)}`}
        />
        <DetailPageActionBar
          secondary={
            <Button variant="outline" className="w-full lg:w-auto" render={<Link to="/odoo/quotations" />}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Elenco preventivi
            </Button>
          }
          primary={<OdooSaleOrderLink saleOrderId={quotation.id} className="text-sm" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
            <CardDescription>Partner Odoo e listino applicato</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Nome">
              <DetailValue empty={!quotation.partnerName}>{quotation.partnerName}</DetailValue>
            </DetailField>
            <DetailField label="Email">
              <DetailValue empty={!quotation.partnerEmail}>{quotation.partnerEmail}</DetailValue>
            </DetailField>
            <DetailField label="Partner Odoo">
              <DetailValue>
                <OdooPartnerLink partnerId={quotation.partnerId} label={quotation.partnerName} />
              </DetailValue>
            </DetailField>
            <DetailField label="Listino">
              <DetailValue empty={!quotation.pricelistName}>{quotation.pricelistName}</DetailValue>
            </DetailField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documento</CardTitle>
            <CardDescription>Date, origine e totali</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Stato">
              <DetailValue>
                <Badge variant="secondary">{quotationStateLabel(quotation.state)}</Badge>
              </DetailValue>
            </DetailField>
            <DetailField label="Totale">
              <DetailValue>
                {quotation.amountTotalCents != null
                  ? formatMoney(quotation.amountTotalCents, quotation.currencyCode ?? 'EUR')
                  : null}
              </DetailValue>
            </DetailField>
            <DetailField label="Validità">
              <DetailValue>{formatDate(quotation.validityDate)}</DetailValue>
            </DetailField>
            <DetailField label="Data impegno">
              <DetailValue>{formatDate(quotation.commitmentDate)}</DetailValue>
            </DetailField>
            <DetailField label="Riferimento cliente">
              <DetailValue empty={!quotation.clientOrderRef}>{quotation.clientOrderRef}</DetailValue>
            </DetailField>
            <DetailField label="Origine">
              <DetailValue empty={!quotation.origin}>{quotation.origin}</DetailValue>
            </DetailField>
            <DetailField label="Fonte" className="sm:col-span-2">
              <DetailValue>{quotation.sourceLabel}</DetailValue>
            </DetailField>
          </CardContent>
        </Card>
      </div>

      {quotation.note ? (
        <Card>
          <CardHeader>
            <CardTitle>Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-gray-900">{quotation.note}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Righe</CardTitle>
          <CardDescription>{quotation.lines.length} articoli nel preventivo</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prodotto</TableHead>
                <TableHead className="text-right">Qtà</TableHead>
                <TableHead className="text-right">Prezzo unit.</TableHead>
                <TableHead className="text-right">Subtotale</TableHead>
                <TableHead>Odoo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nessuna riga.
                  </TableCell>
                </TableRow>
              ) : (
                quotation.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="min-w-0">
                      <p className="truncate font-medium">{line.productName ?? '—'}</p>
                    </TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {line.unitPriceCents != null
                        ? formatMoney(line.unitPriceCents, quotation.currencyCode ?? 'EUR')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {line.subtotalCents != null
                        ? formatMoney(line.subtotalCents, quotation.currencyCode ?? 'EUR')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <OdooHubProductLink odooProductId={line.productId} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
