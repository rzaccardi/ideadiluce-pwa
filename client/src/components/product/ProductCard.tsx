'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { useLocale } from '@/context/locale-context'
import { useI18n } from '@/hooks/use-i18n'
import type { ProductCardDTO } from '@/types/dto'
import { addItem, cartStore, getProductCartQuantity } from '@/features/cart'
import { useProductCardStores } from '@/features/product/useProductCardStores'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { WishlistHeartButton } from '@/components/wishlist/WishlistHeartButton'
import {
  formatAvailabilityPrimaryLabel,
  getProductAvailabilityStatus,
  resolveAvailabilityData,
} from '@/lib/product-availability'
import { formatMoney } from '@/lib/format'
import { formatPriceDisplayModeLabel } from '@/lib/price-display'
import { SiteImage } from '@/components/site/SiteImage'
import { cn } from '@/utils/cn'

type Props = {
  product: ProductCardDTO
  className?: string
}

type QuickAction = 'cart'

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

export function ProductCard({ product, className }: Props) {
  useProductCardStores()
  const { localize, locale } = useLocale()
  const { t, tParams } = useI18n()
  const { cart } = useSnapshot(cartStore)
  const productHref = localize(`/prodotto/${product.slug}`)
  const [pendingAction, setPendingAction] = useState<QuickAction | null>(null)
  const cartQuantity = getProductCartQuantity(cart?.items, product.slug)
  const inCart = cartQuantity > 0
  const availability = useMemo(
    () =>
      getProductAvailabilityStatus({
        availability: resolveAvailabilityData(product),
        locale,
      }),
    [product, locale],
  )
  const availabilityLabel = formatAvailabilityPrimaryLabel(availability)
  const outOfStock = availability.status === 'out_of_stock'
  const canAdd = availability.canAddToCart
  const isAddingToCart = pendingAction === 'cart'
  const priceModeLabel = formatPriceDisplayModeLabel(product.priceDisplayMode)
  async function handleAddToCart() {
    if (!canAdd) return
    setPendingAction('cart')
    try {
      await addItem(product.slug, 1, undefined, {
        productName: product.name,
        imageUrl: product.imageUrl,
      })
    } finally {
      setPendingAction(null)
    }
  }

  const imageAlt = product.name

  return (
    <article
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-lg border border-idl-tech-border bg-idl-tech-panel transition hover:border-idl-border-strong',
        className,
      )}
    >
      <Link to={productHref} className="block text-left">
        <div className="relative aspect-[4/3] bg-idl-cream">
          {product.imageUrl ? (
            <SiteImage
              src={product.imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className={cn('object-cover', outOfStock && 'opacity-75 saturate-50')}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-idl-placeholder">
              {t('product.card.noImage')}
            </div>
          )}
          {outOfStock ? (
            <span className="absolute left-2 top-2 rounded-full bg-idl-promo-bg px-2.5 py-0.5 text-xs font-medium text-idl-promo-text ring-1 ring-idl-promo-border">
              {t('product.availability.outOfStock')}
            </span>
          ) : availability.status === 'orderable' ? (
            <span className="absolute left-2 top-2 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
              {t('product.availability.orderable')}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link to={productHref} className="block flex-1 text-left">
          <h3 className="line-clamp-2 min-h-[2lh] leading-snug font-medium text-idl-graphite">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 min-h-[2lh] text-sm leading-normal text-idl-muted">
            {product.shortDescription ?? '\u00A0'}
          </p>
        </Link>
        <div className="mt-4 flex shrink-0 items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-idl-graphite">
              {formatMoney(product.priceCents, product.currency)}
            </p>
            {priceModeLabel ? (
              <p className="text-xs text-idl-muted">{priceModeLabel}</p>
            ) : null}
            {!outOfStock && availability.status !== 'available' ? (
              <p className="mt-0.5 text-xs text-idl-muted">{availabilityLabel}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <WishlistHeartButton productRef={product.slug} productName={product.name} />
            <button
              type="button"
              aria-label={
                isAddingToCart
                  ? tParams('product.card.addingAria', { productName: product.name })
                  : !canAdd
                    ? tParams('product.card.outOfStockAria', { productName: product.name })
                    : inCart
                      ? tParams('product.card.inCartAria', {
                          productName: product.name,
                          count: cartQuantity,
                        })
                      : tParams('product.card.addAria', { productName: product.name })
              }
              aria-busy={isAddingToCart}
              aria-pressed={inCart}
              disabled={!canAdd || pendingAction !== null}
              title={
                !canAdd
                  ? t('product.availability.outOfStock')
                  : inCart
                    ? tParams('product.card.inCartTitle', { count: cartQuantity })
                    : t('product.addToCart')
              }
              onClick={() => void handleAddToCart()}
              className={cn(
                'relative inline-flex h-10 w-10 items-center justify-center rounded-full transition disabled:cursor-not-allowed',
                outOfStock
                  ? 'border border-idl-promo-border bg-idl-promo-bg text-idl-promo-text'
                  : inCart
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-50'
                    : 'bg-idl-ink text-white hover:bg-idl-ink-soft disabled:opacity-50',
              )}
            >
              {isAddingToCart ? <LoadingSpinner className="opacity-80" /> : <CartIcon />}
              {inCart && !isAddingToCart ? (
                <span
                  className="absolute -right-0.5 -top-0.5 z-10 hidden h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white md:flex"
                  aria-hidden="true"
                >
                  {cartQuantity}
                </span>
              ) : null}
              <span className="sr-only">
                {inCart
                  ? tParams('product.card.inCartTitle', { count: cartQuantity })
                  : t('product.card.cartSr')}
              </span>
            </button>
          </div>
        </div>
      </div>
      {inCart && !isAddingToCart ? (
        <span
          className="pointer-events-none absolute bottom-4 right-4 z-10 flex h-4 min-w-4 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white md:hidden"
          aria-hidden="true"
        >
          {cartQuantity}
        </span>
      ) : null}
    </article>
  )
}
