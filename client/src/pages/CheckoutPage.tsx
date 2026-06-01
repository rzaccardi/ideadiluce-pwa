import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSnapshot } from 'valtio/react'
import { cartStore, fetchCart } from '@/features/cart'
import { authStore } from '@/features/auth'
import {
  canFetchShippingQuotes,
  canStartCheckout,
  checkoutStore,
  confirmPayment,
  createPaymentSession,
  fetchShippingQuotes,
  resetCheckout,
  selectShippingMethod,
  setPaymentMethod,
  setSameAsBilling,
  startCheckout,
  updateCheckoutAddress,
  updateCheckoutEmail,
} from '@/features/checkout'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/Button'
import { TextInput } from '@/components/TextInput'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState } from '@/components/ErrorState'
import { CartSummary } from '@/components/cart/CartSummary'
import { SectionCard } from '@/components/checkout-test/SectionCard'
import { AddressFormSection } from '@/components/checkout-test/AddressFormSection'
import { CheckoutPageSkeleton } from '@/components/Skeleton'
import { StripePaymentShell } from '@/components/checkout/StripePaymentShell'
import type { PwaPaymentMethodDTO } from '@/types/dto'

const paymentMethods: Array<{ id: PwaPaymentMethodDTO; title: string; description: string }> = [
  {
    id: 'stripe',
    title: 'Carta e wallet',
    description: 'Pagamento sicuro con Stripe (carta, Apple Pay, Google Pay quando disponibili).',
  },
  {
    id: 'bank_transfer',
    title: 'Bonifico bancario',
    description: 'Ordine in attesa fino alla registrazione del pagamento in Odoo.',
  },
]

export function CheckoutPage() {
  const cart = useSnapshot(cartStore)
  const checkout = useSnapshot(checkoutStore)
  const auth = useSnapshot(authStore)

  useEffect(() => {
    resetCheckout()
    void fetchCart()
  }, [])

  useEffect(() => {
    if (auth.me?.email && !checkoutStore.draft.email) {
      updateCheckoutEmail(auth.me.email)
    }
    if (auth.me?.firstName) updateCheckoutAddress('billing', 'firstName', auth.me.firstName)
    if (auth.me?.lastName) updateCheckoutAddress('billing', 'lastName', auth.me.lastName)
    if (auth.me?.phone) updateCheckoutAddress('billing', 'phone', auth.me.phone)
  }, [auth.me])

  const c = cart.cart
  const form = checkout.draft
  const canSubmit = canStartCheckout() && !checkout.isLoading
  const canQuotes = canFetchShippingQuotes() && !checkout.shippingLoading

  if (cart.isLoading && !c) {
    return (
      <div className="mx-auto max-w-5xl pb-16">
        <PageHeader title="Checkout" description="Completa ordine e pagamento nella PWA." />
        <CheckoutPageSkeleton />
      </div>
    )
  }

  if (!c || c.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Checkout" description="Serve un carrello non vuoto." />
        <ErrorState
          message="Il carrello è vuoto."
          action={
            <Link to="/catalog">
              <Button>Vai al catalogo</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <PageHeader
        title="Checkout"
        description="Indirizzo, spedizione DHL/FedEx, ordine Odoo e pagamento Stripe sulla stessa esperienza."
      />

      {checkout.error ? (
        <div className="mb-6">
          <ErrorState message={checkout.error} />
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-8">
          <SectionCard title="Dati cliente e indirizzi">
            <div className="space-y-6">
              <TextInput
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateCheckoutEmail(e.target.value)}
              />
              <AddressFormSection
                title="Fatturazione"
                prefix="bill"
                address={form.billing}
                onChange={(key, value) => updateCheckoutAddress('billing', key, String(value))}
              />
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                />
                Spedizione uguale a fatturazione
              </label>
              <AddressFormSection
                title="Spedizione"
                prefix="ship"
                address={form.shipping}
                disabled={form.sameAsBilling}
                onChange={(key, value) => updateCheckoutAddress('shipping', key, String(value))}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!canQuotes}
                onClick={() => void fetchShippingQuotes().catch(() => {})}
              >
                {checkout.shippingLoading ? 'Calcolo…' : 'Calcola spedizione'}
              </Button>
            </div>
          </SectionCard>

          {checkout.shippingQuotes.length > 0 ? (
            <SectionCard title="Metodo di spedizione">
              <div className="grid gap-2">
                {checkout.shippingQuotes.map((q) => (
                  <label
                    key={q.methodRef}
                    className={`cursor-pointer rounded-xl border p-4 ${
                      checkout.selectedShippingMethodRef === q.methodRef
                        ? 'border-zinc-900 bg-zinc-50'
                        : 'border-zinc-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      className="mr-2"
                      checked={checkout.selectedShippingMethodRef === q.methodRef}
                      onChange={() => void selectShippingMethod(q.methodRef).catch(() => {})}
                    />
                    <span className="font-medium">{q.label}</span>
                    <span className="ml-2 tabular-nums text-zinc-600">
                      {formatMoney(q.amountCents, q.currencyCode)}
                    </span>
                    {q.etaDays != null ? (
                      <span className="ml-2 text-xs text-zinc-500">~{q.etaDays} gg</span>
                    ) : null}
                  </label>
                ))}
              </div>
              <Button
                type="button"
                className="mt-4"
                disabled={!canSubmit || checkout.isLoading}
                onClick={() => void startCheckout().catch(() => {})}
              >
                {checkout.isLoading ? 'Creo ordine…' : 'Procedi al pagamento'}
              </Button>
            </SectionCard>
          ) : null}

          {checkout.order ? (
            <SectionCard
              title="Pagamento"
              description={`Ordine ${checkout.order.orderId} · Odoo ${checkout.order.odooSaleOrderId ?? 'n/d'}`}
            >
              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`cursor-pointer rounded-xl border p-4 ${
                      checkout.selectedPaymentMethod === method.id
                        ? 'border-zinc-900 bg-zinc-50'
                        : 'border-zinc-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={checkout.selectedPaymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="mr-2"
                    />
                    <span className="font-medium">{method.title}</span>
                    <p className="mt-1 text-sm text-zinc-500">{method.description}</p>
                  </label>
                ))}
              </div>
              {!checkout.payment ? (
                <Button
                  type="button"
                  className="mt-4"
                  disabled={checkout.isLoading}
                  onClick={() => void createPaymentSession().catch(() => {})}
                >
                  Continua
                </Button>
              ) : null}
            </SectionCard>
          ) : null}

          {checkout.payment ? (
            <SectionCard title="Completa pagamento">
              {checkout.payment.method === 'stripe' && checkout.payment.clientSecret ? (
                <StripePaymentShell
                  clientSecret={checkout.payment.clientSecret}
                  orderId={checkout.payment.orderId}
                  onError={(msg) => {
                    checkoutStore.error = msg
                  }}
                />
              ) : null}
              {checkout.payment.method === 'bank_transfer' ? (
                <div className="space-y-3">
                  {checkout.payment.instructions ? (
                    <pre className="overflow-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-50">
                      {JSON.stringify(checkout.payment.instructions, null, 2)}
                    </pre>
                  ) : null}
                  <Button
                    type="button"
                    disabled={checkout.isPaying}
                    onClick={() => void confirmPayment('pending').catch(() => {})}
                  >
                    Conferma ordine in attesa bonifico
                  </Button>
                </div>
              ) : null}
            </SectionCard>
          ) : null}
        </div>

        <aside>
          <CartSummary cart={c} />
        </aside>
      </div>
    </div>
  )
}
