'use client'

import { useState } from 'react'
import { Link } from '@/lib/navigation'
import type { ProductCardDTO } from '@/types/dto'
import { addItem } from '@/features/cart'
import { buildCartAddHintFromCard } from '@/features/cart/cart-add-hint'
import { formatMoney } from '@/lib/format'
import { CartLineThumb } from '@/components/cart/CartLineThumb'
import { useI18n } from '@/hooks/use-i18n'
import { CART_CARD_SURFACE } from '@/components/cart/cart-surfaces'
import { cn } from '@/utils/cn'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  isLoading: boolean
  error: string | null
  className?: string
}

function RecommendationCard({ product }: { product: ProductCardDTO }) {
  const [isAdding, setIsAdding] = useState(false)

  async function onAdd() {
    setIsAdding(true)
    try {
      await addItem(product.slug, 1, undefined, {
        feedback: {
          productName: product.name,
          imageUrl: product.imageUrl,
        },
        productHint: buildCartAddHintFromCard(product),
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-idl-tech-border bg-white p-3 dark:bg-idl-tech-panel">
      <Link to={`/prodotto/${product.slug}`} className="shrink-0">
        <CartLineThumb
          imageUrl={product.imageUrl}
          name={product.name}
          className="size-12 rounded-[7px]"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to={`/prodotto/${product.slug}`}
          className="line-clamp-2 text-[12.5px] font-semibold leading-tight text-idl-graphite hover:underline"
        >
          {product.name}
        </Link>
        <div className="mt-1 text-[13px] font-extrabold text-idl-graphite">
          {formatMoney(product.priceCents, product.currency)}
        </div>
      </div>
      <button
        type="button"
        disabled={isAdding}
        onClick={() => void onAdd()}
        className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-idl-amber text-[17px] font-bold text-white dark:text-idl-design transition hover:bg-[#2a2a2e] disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Aggiungi al carrello"
      >
        +
      </button>
    </div>
  )
}

export function CartRecommendationsSection({ products, isLoading, error, className }: Props) {
  const { t } = useI18n()

  if (!isLoading && !error && products.length === 0) return null

  return (
    <section
      className={cn(CART_CARD_SURFACE, 'p-[22px]', className)}
    >
      <h2 className="text-base font-extrabold tracking-tight text-idl-graphite">
        {t('cart.recommendationsTitle')}
      </h2>
      <p className="mt-1 text-[13px] text-idl-muted">{t('cart.recommendationsDescription')}</p>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-idl-muted">{t('cart.recommendationsLoading')}</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-idl-muted">{error}</p>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-sm text-idl-muted">{t('cart.recommendationsEmpty')}</p>
      ) : (
        <div className="mt-[18px] grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <RecommendationCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
