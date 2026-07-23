'use client'

import { useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { useLocale } from '@/context/locale-context'
import { useI18n } from '@/hooks/use-i18n'
import type { ProductCardDTO } from '@/types/dto'
import { addItem, cartStore, getProductCartQuantity } from '@/features/cart'
import { buildCartAddHintFromCard } from '@/features/cart/cart-add-hint'
import { useProductCardStores } from '@/features/product/useProductCardStores'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  formatAvailabilityPrimaryLabel,
  getProductAvailabilityStatus,
  resolveAvailabilityData,
} from '@/lib/product-availability'
import { cn } from '@/utils/cn'

type Props = {
  product: Pick<
    ProductCardDTO,
    'slug' | 'name' | 'imageUrl' | 'inStock' | 'availability' | 'priceCents' | 'odooTemplateId'
  >
  label?: string
  className?: string
}

export function TechnicalAddToCartButton({ product, label = 'Aggiungi', className }: Props) {
  useProductCardStores()
  const { locale } = useLocale()
  const { t, tParams } = useI18n()
  const { cart } = useSnapshot(cartStore)
  const [isAdding, setIsAdding] = useState(false)

  const cartQuantity = getProductCartQuantity(cart?.items, product.slug)
  const inCart = cartQuantity > 0
  const availability = getProductAvailabilityStatus({
    availability: resolveAvailabilityData(product),
    locale,
  })
  const canAdd = availability.canAddToCart

  async function handleAddToCart() {
    if (!canAdd || isAdding) return
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

  const buttonLabel = isAdding
    ? t('product.addingToCart')
    : inCart
      ? tParams('product.card.inCartTitle', { count: cartQuantity })
      : label

  return (
    <button
      type="button"
      aria-label={
        isAdding
          ? tParams('product.card.addingAria', { productName: product.name })
          : !canAdd
            ? tParams('product.card.outOfStockAria', { productName: product.name })
            : inCart
              ? tParams('product.card.inCartAria', { productName: product.name, count: cartQuantity })
              : tParams('product.card.addAria', { productName: product.name })
      }
      aria-busy={isAdding}
      aria-pressed={inCart}
      disabled={!canAdd || isAdding}
      title={
        !canAdd
          ? formatAvailabilityPrimaryLabel(availability)
          : inCart
            ? tParams('product.card.inCartTitle', { count: cartQuantity })
            : t('product.addToCart')
      }
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void handleAddToCart()
      }}
      className={cn(
        'inline-flex min-w-[72px] items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-bold text-white dark:text-idl-design transition disabled:cursor-not-allowed disabled:opacity-50',
        !canAdd
          ? 'bg-idl-tech-panel text-idl-muted'
          : inCart
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : 'bg-idl-amber hover:bg-idl-amber/90',
        className,
      )}
    >
      {isAdding ? <LoadingSpinner className="h-3.5 w-3.5" /> : null}
      <span>{buttonLabel}</span>
    </button>
  )
}
