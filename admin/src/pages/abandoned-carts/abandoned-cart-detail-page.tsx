import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { ArrowLeftIcon } from 'lucide-react'
import {
  adminAbandonedCartsStore,
  fetchAdminAbandonedCartDetail,
  resetAdminAbandonedCartDetail,
} from '@/features/abandoned-carts'
import { formatMoney } from '@/lib/format'
import {
  DetailField,
  DetailPageActionBar,
  DetailValue,
  RouteSkeleton,
  SitePageHeader,
} from '@/components/shared'
import { ABANDONED_EVENT_LABELS } from '@/types/abandoned-carts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

export function AbandonedCartDetailPage() {
  const { id } = useParams<{ id: string }>()
  const store = useSnapshot(adminAbandonedCartsStore)

  useEffect(() => {
    if (!id) return
    void fetchAdminAbandonedCartDetail(id)
    return () => {
      resetAdminAbandonedCartDetail()
    }
  }, [id])

  if (store.detailLoading || (store.detailId === id && !store.detail && !store.detailError)) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio carrello abbandonato" />
        <RouteSkeleton variant="detail" />
      </div>
    )
  }

  if (store.detailError && store.detailId === id && !store.detail) {
    return (
      <div className="space-y-6">
        <SitePageHeader title="Dettaglio carrello" />
        <Alert variant="destructive">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{store.detailError}</AlertDescription>
        </Alert>
        <Button variant="outline" render={<Link to="/abandoned-carts" />}>
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Torna all&apos;elenco
        </Button>
      </div>
    )
  }

  const cart = store.detail
  if (!cart || cart.id !== id) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SitePageHeader
          title="Carrello abbandonato"
          description={`${ABANDONED_EVENT_LABELS[cart.eventType] ?? cart.eventType} · ${new Date(cart.createdAt).toLocaleString('it-IT')}`}
        />
        <DetailPageActionBar
          secondary={
            <Button variant="outline" className="w-full lg:w-auto" render={<Link to="/abandoned-carts" />}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              Elenco carrelli
            </Button>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contatto</CardTitle>
            <CardDescription>Email e utente al momento dell&apos;evento</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Email">
              <DetailValue>{cart.contactEmail ?? '—'}</DetailValue>
            </DetailField>
            <DetailField label="Utente">
              <DetailValue>
                {cart.userId ? (
                  <Link
                    to={`/customers/${cart.userId}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {cart.userEmail ?? cart.userId}
                  </Link>
                ) : (
                  'Guest'
                )}
              </DetailValue>
            </DetailField>
            <DetailField label="ID carrello">
              <DetailValue>{cart.cartId}</DetailValue>
            </DetailField>
            <DetailField label="Righe">
              <DetailValue>{cart.itemCount}</DetailValue>
            </DetailField>
          </CardContent>
        </Card>

        {cart.cart ? (
          <Card>
            <CardHeader>
              <CardTitle>Stato carrello</CardTitle>
              <CardDescription>Snapshot al momento dell&apos;abbandono</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Stato">
                <DetailValue>{cart.cart.status}</DetailValue>
              </DetailField>
              <DetailField label="Totale stimato">
                <DetailValue>
                  {cart.cart.estimatedTotal != null
                    ? formatMoney(cart.cart.estimatedTotal, 'EUR')
                    : '—'}
                </DetailValue>
              </DetailField>
              <DetailField label="Creato">
                <DetailValue>
                  {new Date(cart.cart.createdAt).toLocaleString('it-IT')}
                </DetailValue>
              </DetailField>
              <DetailField label="Abbandonato">
                <DetailValue>
                  {cart.cart.abandonedAt
                    ? new Date(cart.cart.abandonedAt).toLocaleString('it-IT')
                    : '—'}
                </DetailValue>
              </DetailField>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Righe carrello</CardTitle>
          <CardDescription>{cart.lines.length} articoli nello snapshot</CardDescription>
        </CardHeader>
        <CardContent className="table-bleed mt-0 px-0 pt-0 sm:px-0">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="min-w-[200px]">Prodotto</TableHead>
                  <TableHead>Variante</TableHead>
                  <TableHead className="text-right">Qtà</TableHead>
                  <TableHead className="text-right">Prezzo stim.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.lines.map((line, i) => (
                  <TableRow key={`${line.productRef}-${i}`}>
                    <TableCell>
                      <p className="font-medium">{line.productName ?? line.productRef}</p>
                      {line.productSlug ? (
                        <p className="text-xs text-muted-foreground">{line.productSlug}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {line.variantRef ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.unitEstimateCents != null
                        ? formatMoney(line.unitEstimateCents, 'EUR')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
