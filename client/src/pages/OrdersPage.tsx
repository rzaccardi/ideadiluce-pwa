import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/endpoints'
import type { OrderDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { ApiRequestError } from '@/types/api'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { ListSkeleton } from '@/components/Skeleton'

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api.orders
      .list()
      .then(setOrders)
      .catch((e) =>
        setError(e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore'),
      )
  }, [])

  if (error) {
    return (
      <>
        <PageHeader title="Ordini" />
        <ErrorState message={error} />
      </>
    )
  }

  if (orders === null) {
    return (
      <>
        <PageHeader title="Ordini" />
        <ListSkeleton />
      </>
    )
  }

  if (orders.length === 0) {
    return (
      <>
        <PageHeader title="Ordini" />
        <EmptyState title="Nessun ordine" description="Qui compariranno gli ordini sincronizzati (OrderCache)." />
      </>
    )
  }

  return (
    <div>
      <PageHeader title="Ordini" description="Dati da GET /api/v1/orders (cache applicativa)." />
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id}>
            <Link
              to={`/account/orders/${o.id}`}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300"
            >
              <div>
                <p className="font-medium text-zinc-900">Rif. {o.odooSaleOrderId}</p>
                <p className="text-xs text-zinc-500">{new Date(o.createdAt).toLocaleDateString('it-IT')}</p>
              </div>
              <span className="text-sm font-semibold">
                {o.totalAmount != null && o.currencyCode
                  ? formatMoney(o.totalAmount, o.currencyCode)
                  : '—'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
