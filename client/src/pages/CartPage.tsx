import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { cartStore, clearCart, fetchCart, fetchRecommendations, removeItem, updateItem } from '@/features/cart'
import { PageHeader } from '@/components/PageHeader'
import { formatMoney } from '@/lib/format'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/Button'
import { QuantityInput } from '@/components/QuantityInput'
import { CartSummary } from '@/components/cart/CartSummary'
import { CartItemsSkeleton, CartSummarySkeleton } from '@/components/Skeleton'
import { ProductGrid } from '@/components/product/ProductGrid'

export function CartPage() {
  const cart = useSnapshot(cartStore)
  const recommendationKey = cart.cart?.items.map((line) => line.productRef).sort().join('|') ?? ''

  useEffect(() => {
    void fetchCart()
  }, [])

  useEffect(() => {
    if (recommendationKey) void fetchRecommendations()
  }, [recommendationKey])

  if (cart.isLoading && !cart.cart) {
    return (
      <div>
        <PageHeader title="Carrello" description="Step standard prima del checkout: modifica quantita, rimozione righe e stime totali." />
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <CartItemsSkeleton />
          <CartSummarySkeleton showCheckoutCta />
        </div>
      </div>
    )
  }

  if (cart.error && !cart.cart) {
    return <ErrorState message={cart.error} />
  }

  const c = cart.cart

  if (!c || c.items.length === 0) {
    return (
      <>
        <PageHeader title="Carrello" />
        <EmptyState
          title="Carrello vuoto"
          action={
            <Link to="/catalog">
              <Button>Sfoglia catalogo</Button>
            </Link>
          }
        />
      </>
    )
  }

  const lineUnit = (cents: number | null) =>
    cents != null ? formatMoney(cents, c.currencyCode) : '—'
  const lineTot = (cents: number | null) =>
    cents != null ? formatMoney(cents, c.currencyCode) : '—'

  return (
    <div>
      <PageHeader title="Carrello" description="Step standard prima del checkout: modifica quantita, rimozione righe e stime totali." />
      {cart.error ? <ErrorState message={cart.error} className="mb-6" /> : null}

      <div className="mb-4 flex justify-end">
        <Button variant="secondary" disabled={cart.isLoading} onClick={() => void clearCart()}>
          Svuota carrello
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <ul className="space-y-3">
            {c.items.map((line) => (
              <li
                key={line.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    to={`/prodotto/${line.productSlug ?? line.productRef}`}
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    {line.productName ?? line.productSlug ?? line.productRef}
                  </Link>
                  {line.variantRef ? (
                    <p className="text-xs text-zinc-500">Variante: {line.variantRef}</p>
                  ) : null}
                  <p className="text-sm text-zinc-500">{lineUnit(line.clientUnitPriceEstimateCents)} cad.</p>
                </div>
                <div className="flex items-center gap-3">
                  <QuantityInput
                    min={1}
                    defaultValue={line.quantity}
                    onBlur={(e) => {
                      const q = Number(e.target.value)
                      if (q >= 1 && q !== line.quantity) void updateItem(line.id, q)
                    }}
                  />
                  <span className="text-sm font-medium">{lineTot(line.lineTotalEstimateCents)}</span>
                  <Button variant="ghost" size="sm" onClick={() => void removeItem(line.id)}>
                    Rimuovi
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="mb-4">
              <h2 className="font-medium text-zinc-900">Add-on consigliati</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Prodotti suggeriti da Odoo in base alle categorie presenti nel carrello.
              </p>
            </div>
            {cart.isRecommendationsLoading ? (
              <p className="py-8 text-center text-sm text-zinc-500">Caricamento suggerimenti...</p>
            ) : cart.recommendationsError ? (
              <ErrorState message={cart.recommendationsError} />
            ) : (
              <ProductGrid
                products={cart.recommendations}
                emptyMessage="Nessun add-on consigliato per questi prodotti."
              />
            )}
          </section>
        </div>
        <CartSummary cart={c} showCheckoutCta />
      </div>
    </div>
  )
}
