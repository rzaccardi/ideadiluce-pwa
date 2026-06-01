import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductCardDTO } from '@/types/dto'
import { addItem } from '@/features/cart'
import { addWishlistItem } from '@/features/wishlist'
import { formatMoney } from '@/lib/format'
import { cn } from '@/utils/cn'

type Props = {
  product: ProductCardDTO
  className?: string
}

type QuickAction = 'cart' | 'wishlist'

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none">
      <path
        d="M6.5 6.5h14l-1.4 7.2a2 2 0 0 1-2 1.6H9.3a2 2 0 0 1-2-1.7L6.1 4.8H3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none">
      <path
        d="M12 20s-7.5-4.4-9.2-9.2C1.6 7.4 3.7 4.5 7 4.5c1.9 0 3.3 1 4.1 2.3.8-1.3 2.2-2.3 4.1-2.3 3.3 0 5.4 2.9 4.2 6.3C19.5 15.6 12 20 12 20Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function ProductCard({ product, className }: Props) {
  const [pendingAction, setPendingAction] = useState<QuickAction | null>(null)
  const [wishlistFeedback, setWishlistFeedback] = useState<string | null>(null)

  async function handleQuickAction(action: QuickAction) {
    setPendingAction(action)
    if (action === 'wishlist') setWishlistFeedback(null)
    try {
      if (action === 'cart') {
        await addItem(product.slug, 1, undefined, {
          productName: product.name,
          imageUrl: product.imageUrl,
        })
      } else {
        await addWishlistItem(product.slug)
        setWishlistFeedback('Aggiunto ai preferiti')
      }
    } catch {
      if (action === 'wishlist') setWishlistFeedback('Azione non riuscita')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-zinc-300',
        className,
      )}
    >
      <Link to={`/prodotto/${product.slug}`} className="block text-left">
        <div className="aspect-[4/3] bg-zinc-100">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-400">Nessuna immagine</div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/prodotto/${product.slug}`} className="block text-left">
          <h3 className="font-medium text-zinc-900">{product.name}</h3>
          {product.shortDescription ? (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{product.shortDescription}</p>
          ) : null}
        </Link>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-zinc-900">
            {formatMoney(product.priceCents, product.currency)}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={`Aggiungi ${product.name} ai preferiti`}
              title="Aggiungi ai preferiti"
              disabled={pendingAction !== null}
              onClick={() => void handleQuickAction('wishlist')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HeartIcon />
              <span className="sr-only">Preferiti</span>
            </button>
            <button
              type="button"
              aria-label={`Aggiungi ${product.name} al carrello`}
              title="Aggiungi al carrello"
              disabled={pendingAction !== null}
              onClick={() => void handleQuickAction('cart')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CartIcon />
              <span className="sr-only">Carrello</span>
            </button>
          </div>
        </div>
        {wishlistFeedback ? <p className="mt-2 text-xs text-zinc-500">{wishlistFeedback}</p> : null}
      </div>
    </article>
  )
}
