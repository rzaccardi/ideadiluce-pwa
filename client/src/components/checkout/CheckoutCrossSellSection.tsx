'use client'

import { useState } from 'react'
import { Link } from '@/lib/navigation'
import type { ProductCardDTO } from '@/types/dto'
import { addItem } from '@/features/cart'
import { buildCartAddHintFromCard } from '@/features/cart/cart-add-hint'
import { formatMoney } from '@/lib/format'
import { CartLineThumb } from '@/components/cart/CartLineThumb'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Theme = 'dark' | 'light'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  isLoading: boolean
  theme?: Theme
  className?: string
  onAdded?: () => void
}

function CrossSellRow({
  product,
  theme,
  onAdded,
}: {
  product: ProductCardDTO
  theme: Theme
  onAdded?: () => void
}) {
  const { t } = useI18n()
  const [isAdding, setIsAdding] = useState(false)
  const dark = theme === 'dark'

  async function handleAdd() {
    setIsAdding(true)
    try {
      await addItem(product.slug, 1, undefined, {
        feedback: {
          productName: product.name,
          imageUrl: product.imageUrl,
        },
        productHint: buildCartAddHintFromCard(product),
      })
      onAdded?.()
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[11px] border p-[11px]',
        dark ? 'border-white/[0.08]' : 'border-idl-tech-border bg-idl-tech-panel',
      )}
    >
      <Link to={`/prodotto/${product.slug}`} className="shrink-0">
        <CartLineThumb
          imageUrl={product.imageUrl}
          name={product.name}
          className={cn('size-[42px] rounded-lg', dark ? 'border-white/10' : 'border-idl-tech-border')}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to={`/prodotto/${product.slug}`}
          className={cn(
            'line-clamp-2 text-[12.5px] font-semibold leading-tight hover:underline',
            dark ? 'text-[#f1e8d8]' : 'text-idl-graphite',
          )}
        >
          {product.name}
        </Link>
        <p className={cn('mt-0.5 text-xs tabular-nums', dark ? 'text-[#b0b0b4]' : 'text-idl-muted')}>
          {formatMoney(product.priceCents, product.currency)}
        </p>
      </div>
      <button
        type="button"
        disabled={isAdding}
        onClick={() => void handleAdd()}
        aria-label={t('checkout.summary.crossSellAdd')}
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60',
          dark ? 'bg-[#3a332a] hover:bg-[#4d4438]' : 'bg-[#d9831a] hover:bg-[#b08e3e]',
        )}
      >
        +
      </button>
    </div>
  )
}

export function CheckoutCrossSellSection({
  products,
  isLoading,
  theme = 'dark',
  className,
  onAdded,
}: Props) {
  const { t } = useI18n()
  const dark = theme === 'dark'
  const items = products.slice(0, 2)

  if (!isLoading && items.length === 0) return null

  return (
    <section className={cn('mt-5', className)}>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span
          className={cn(
            'font-mono text-[10px] font-bold uppercase tracking-[0.14em]',
            dark ? 'text-[#b0b0b4]' : 'text-[#9a7b33]',
          )}
        >
          {t('checkout.summary.crossSellTitle')}
        </span>
        <span className={cn('text-[11.5px]', dark ? 'text-[#6f6450]' : 'text-idl-muted')}>
          {t('checkout.summary.crossSellCompat')}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'h-[64px] animate-pulse rounded-[11px] border',
                dark ? 'border-white/[0.08] bg-idl-tech-panel/[0.04]' : 'border-idl-tech-border bg-idl-tech-panel',
              )}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((product) => (
            <CrossSellRow key={product.slug} product={product} theme={theme} onAdded={onAdded} />
          ))}
        </div>
      )}
    </section>
  )
}
