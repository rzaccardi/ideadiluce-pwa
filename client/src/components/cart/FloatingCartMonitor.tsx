import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { cartStore, fetchCart, reprice } from '@/features/cart'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'

const POLL_MS = 30_000

export function FloatingCartMonitor() {
  const { cart, error, isLoading } = useSnapshot(cartStore)
  const { pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) void fetchCart()
    }

    const onVisibilityChange = () => {
      if (!document.hidden) refresh()
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibilityChange)
    const intervalId = window.setInterval(refresh, POLL_MS)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.clearInterval(intervalId)
    }
  }, [])

  const itemCount = cart?.itemCount ?? 0
  const total = cart?.estimatedTotal ?? cart?.estimatedSubtotal ?? null
  const isCartFlow = pathname === '/cart' || pathname.startsWith('/checkout')

  if (isCartFlow) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen ? (
        <section className="w-[min(calc(100vw-2.5rem),380px)] rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl shadow-zinc-950/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Monitor carrello
              </p>
              <h2 className="text-lg font-semibold text-zinc-900">Carrello</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Chiudi mini carrello"
            >
              Chiudi
            </button>
          </div>

          {isLoading && !cart ? (
            <div className="mt-4 rounded-xl bg-zinc-50 p-3" role="status">
              <span className="sr-only">Caricamento mini carrello...</span>
              <div className="flex justify-between gap-6">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="mt-2 flex justify-between gap-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="mt-3 h-3 w-full" />
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">
              <div className="flex justify-between">
                <span>Articoli</span>
                <span className="font-medium text-zinc-900">{itemCount}</span>
              </div>
              {cart && total != null ? (
                <div className="mt-1 flex justify-between">
                  <span>Totale stimato</span>
                  <span className="font-medium text-zinc-900">
                    {formatMoney(total, cart.currencyCode)}
                  </span>
                </div>
              ) : null}
              <p className="mt-2 text-xs text-zinc-500">
                Aggiornamento automatico ogni {POLL_MS / 1000}s e al ritorno sulla finestra.
              </p>
            </div>
          )}

          {cart && cart.items.length > 0 ? (
            <ul className="mt-4 max-h-56 space-y-2 overflow-auto pr-1">
              {cart.items.slice(0, 4).map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-zinc-100 p-3 text-sm"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/prodotto/${item.productSlug ?? item.productRef}`}
                      className="block truncate font-medium text-zinc-900 hover:underline"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.productRef}
                    </Link>
                    <p className="text-xs text-zinc-500">Quantita: {item.quantity}</p>
                  </div>
                  {item.lineTotalEstimateCents != null ? (
                    <span className="shrink-0 text-xs font-medium text-zinc-700">
                      {formatMoney(item.lineTotalEstimateCents, cart.currencyCode)}
                    </span>
                  ) : null}
                </li>
              ))}
              {cart.items.length > 4 ? (
                <li className="text-center text-xs text-zinc-500">
                  +{cart.items.length - 4} righe nel carrello
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-200 p-4 text-center text-sm text-zinc-500">
              Il carrello e vuoto.
            </p>
          )}

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              variant="secondary"
              disabled={isLoading}
              onClick={() => void reprice()}
              className="w-full"
            >
              {isLoading ? 'Aggiorno...' : 'Aggiorna da Odoo'}
            </Button>
            <Link to="/cart" onClick={() => setIsOpen(false)}>
              <Button className="w-full">Apri carrello</Button>
            </Link>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-zinc-950/20 transition hover:bg-zinc-800"
        aria-expanded={isOpen}
        aria-label="Apri mini carrello"
      >
        Carrello
        {itemCount > 0 ? (
          <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-zinc-900">
            {itemCount}
          </span>
        ) : null}
      </button>
    </div>
  )
}
