import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '@/api/endpoints'
import type { PwaOrderStatusResponseDTO } from '@/types/dto'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/Button'
import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { formatMoney } from '@/lib/format'

export function PaymentResultPage() {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<PwaOrderStatusResponseDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const sessionId = searchParams.get('session_id')
        const paymentIntent = searchParams.get('payment_intent')
        if (sessionId || paymentIntent) {
          await api.payments.stripeReturn({
            sessionId: sessionId ?? undefined,
            orderId: sessionId ? undefined : orderId,
          })
        } else {
          await api.payments.stripeReturn({ orderId: orderId! })
        }
        const s = await api.orders.status(orderId!)
        if (!cancelled) setStatus(s)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Errore recupero ordine')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [orderId, searchParams])

  if (loading) return <LoadingState message="Verifica pagamento…" />
  if (error || !status) return <ErrorState message={error ?? 'Ordine non trovato'} />

  const title =
    status.paymentStatus === 'captured'
      ? 'Pagamento riuscito'
      : status.paymentStatus === 'pending'
        ? 'Pagamento in attesa'
        : status.paymentStatus === 'failed'
          ? 'Pagamento fallito'
          : 'Stato pagamento'

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <PageHeader title={title} description="Sincronizzazione con Odoo quando configurato." />
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Ordine PWA</dt>
            <dd className="font-mono text-xs">{status.orderId}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Ordine Odoo</dt>
            <dd>{status.odooSaleOrderId ?? 'n/d'}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Stato pagamento</dt>
            <dd>{status.paymentStatus}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Totale</dt>
            <dd>
              {status.amountTotal != null
                ? formatMoney(status.amountTotal, status.currencyCode)
                : 'n/d'}
            </dd>
          </div>
        </dl>
        {status.lastPaymentError ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {status.lastPaymentError}
          </p>
        ) : null}
        <div className="mt-6 flex gap-3">
          <Link to="/account/orders">
            <Button>I miei ordini</Button>
          </Link>
          <Link to="/catalog">
            <Button variant="secondary">Catalogo</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
