import { Link } from 'react-router-dom'
import type { CartDTO, CartItemDTO } from '@/types/dto'

/** Compatibile con snapshot Valtio (readonly). */
type CartLike = Omit<CartDTO, 'items'> & { items: ReadonlyArray<CartItemDTO> }
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/Button'
import { cn } from '@/utils/cn'

type Props = {
  cart: CartLike
  className?: string
  /** Se true mostra CTA checkout (es. pagina carrello). */
  showCheckoutCta?: boolean
}

export function CartSummary({ cart, className, showCheckoutCta }: Props) {
  const subtotal =
    cart.estimatedSubtotal ?? cart.items.reduce((s, i) => s + (i.lineTotalEstimateCents ?? 0), 0)
  const total =
    cart.estimatedTotal ??
    subtotal + (cart.estimatedTax ?? 0) + (cart.estimatedShipping ?? 0)

  return (
    <aside
      className={cn(
        'h-fit rounded-xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/5',
        className,
      )}
    >
      <h2 className="text-sm font-semibold text-zinc-900">Riepilogo</h2>
      <dl className="mt-4 space-y-2 text-sm text-zinc-600">
        <div className="flex justify-between">
          <dt>Subtotale (stim.)</dt>
          <dd>{formatMoney(subtotal, cart.currencyCode)}</dd>
        </div>
        {cart.estimatedTax != null ? (
          <div className="flex justify-between">
            <dt>IVA (stim.)</dt>
            <dd>{formatMoney(cart.estimatedTax, cart.currencyCode)}</dd>
          </div>
        ) : null}
        {cart.estimatedShipping != null ? (
          <div className="flex justify-between">
            <dt>Spedizione (stim.)</dt>
            <dd>{formatMoney(cart.estimatedShipping, cart.currencyCode)}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 flex justify-between border-t border-zinc-100 pt-4 text-base font-semibold text-zinc-900">
        Totale
        <span>{formatMoney(total, cart.currencyCode)}</span>
      </p>
      {showCheckoutCta ? (
        <Link to="/checkout" className="mt-6 block">
          <Button className="w-full">Vai al checkout</Button>
        </Link>
      ) : null}
    </aside>
  )
}
