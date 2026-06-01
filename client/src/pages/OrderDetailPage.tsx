import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/api/endpoints'
import type { OrderDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { ApiRequestError } from '@/types/api'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [error, setError] = useState<{ id: string; message: string } | null>(null)

  useEffect(() => {
    let ignore = false
    void api.orders
      .get(id)
      .then((o) => {
        if (ignore) return
        setOrder(o)
        setError(null)
      })
      .catch((e) => {
        if (ignore) return
        setOrder(null)
        setError({
          id,
          message: e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore',
        })
      })

    return () => {
      ignore = true
    }
  }, [id])

  const currentError = error?.id === id ? error.message : null
  const isLoading = order?.id !== id && !currentError

  if (currentError) {
    return (
      <>
        <PageHeader title="Ordine" />
        <ErrorState
          message={currentError}
          action={
            <Link to="/account/orders">
              <Button variant="secondary">Torna agli ordini</Button>
            </Link>
          }
        />
      </>
    )
  }

  if (isLoading || !order) {
    return (
      <>
        <PageHeader title="Ordine" />
        <div className="mt-2 space-y-2" role="status">
          <span className="sr-only">Caricamento ordine...</span>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex justify-between border-b border-zinc-100 py-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <div>
      <Link to="/account/orders" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Ordini
      </Link>
      <PageHeader
        title="Ordine"
        description={`Odoo #${order.odooSaleOrderId}${order.pwaOrderId ? ` · PWA ${order.pwaOrderId}` : ''}`}
      />
      <dl className="mt-2 space-y-2 text-sm">
        <div className="flex justify-between border-b border-zinc-100 py-2">
          <dt className="text-zinc-500">Stato</dt>
          <dd className="font-medium text-zinc-900">{order.status}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-100 py-2">
          <dt className="text-zinc-500">Pagamento</dt>
          <dd className="font-medium text-zinc-900">{order.paymentStatus ?? '—'}</dd>
        </div>
        <div className="flex justify-between border-b border-zinc-100 py-2">
          <dt className="text-zinc-500">Totale</dt>
          <dd className="font-medium text-zinc-900">
            {order.totalAmount != null && order.currencyCode
              ? formatMoney(order.totalAmount, order.currencyCode)
              : '—'}
          </dd>
        </div>
        <div className="flex justify-between py-2">
          <dt className="text-zinc-500">Data</dt>
          <dd className="font-medium text-zinc-900">
            {new Date(order.createdAt).toLocaleString('it-IT')}
          </dd>
        </div>
      </dl>
      {order.odooPortalUrl ? (
        <p className="mt-6">
          <a
            href={order.odooPortalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-zinc-900 underline"
          >
            Apri portale Odoo (fattura / dettaglio)
          </a>
        </p>
      ) : (
        <p className="mt-6 text-xs text-zinc-500">
          Link portale Odoo disponibile dopo sincronizzazione pagamento.
        </p>
      )}
    </div>
  )
}
