'use client'

import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { addWishlistItem, isProductInWishlist, removeWishlistItem, wishlistStore } from '@/features/wishlist'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  productRef: string
  variantRef?: string | null
  productName: string
  className?: string
  disabled?: boolean
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('h-4 w-4', className)} fill={filled ? 'currentColor' : 'none'}>
      <path
        d="M12 20s-7.5-4.4-9.2-9.2C1.6 7.4 3.7 4.5 7 4.5c1.9 0 3.3 1 4.1 2.3.8-1.3 2.2-2.3 4.1-2.3 3.3 0 5.4 2.9 4.2 6.3C19.5 15.6 12 20 12 20Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={filled ? 0 : 1.8}
      />
    </svg>
  )
}

export function WishlistHeartButton({
  productRef,
  variantRef,
  className,
  disabled = false,
}: Props) {
  const { t } = useI18n()
  const { items } = useSnapshot(wishlistStore)
  const inStore = isProductInWishlist(items, productRef, variantRef)
  const [optimisticFavorited, setOptimisticFavorited] = useState(false)
  const [isBouncing, setIsBouncing] = useState(false)
  const isFavorited = inStore || optimisticFavorited

  useEffect(() => {
    if (inStore) setOptimisticFavorited(false)
  }, [inStore])

  function triggerBounce() {
    setIsBouncing(true)
    window.setTimeout(() => setIsBouncing(false), 600)
  }

  function findWishlistEntry() {
    if (variantRef === undefined) {
      return items.find((i) => i.productRef === productRef)
    }
    const variant = variantRef ?? null
    return items.find(
      (i) => i.productRef === productRef && (i.variantRef ?? null) === variant,
    )
  }

  async function handleClick() {
    if (disabled) return
    triggerBounce()

    if (isFavorited) {
      const entry = findWishlistEntry()
      if (entry) {
        try {
          await removeWishlistItem(entry.id)
        } catch {
          /* errore già in wishlistStore.error */
        }
      } else {
        setOptimisticFavorited(false)
      }
      return
    }

    setOptimisticFavorited(true)
    try {
      await addWishlistItem(productRef, variantRef)
    } catch {
      setOptimisticFavorited(false)
    }
  }

  const label = isFavorited ? t('wishlist.heart.remove') : t('wishlist.heart.add')

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isFavorited}
      disabled={disabled}
      onClick={() => void handleClick()}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full border bg-idl-tech-panel transition disabled:cursor-not-allowed disabled:opacity-50',
        isFavorited
          ? 'border-rose-200 text-rose-500 hover:border-rose-300 hover:bg-rose-50'
          : 'border-idl-border text-idl-ink-soft hover:border-idl-border-strong hover:bg-idl-cream',
        isBouncing && 'wishlist-heart-bounce',
        className,
      )}
    >
      <HeartIcon filled={isFavorited} className={isFavorited ? 'text-rose-500' : undefined} />
      <span className="sr-only">{t('wishlist.title')}</span>
    </button>
  )
}
