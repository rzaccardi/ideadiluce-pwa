'use client'

import { Link } from '@/lib/navigation'
import { toast } from 'sonner'
import type { ProductCardDTO } from '@/types/dto'
import { useLocale } from '@/context/locale-context'
import { addItem } from '@/features/cart'
import { removeWishlistItem } from '@/features/wishlist'
import { formatMoney } from '@/lib/format'
import { Button } from '@/components/Button'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  itemId: string
  productRef: string
  variantRef: string | null
  product: ProductCardDTO | null
  unavailable?: boolean
  onRemoved?: () => void
  className?: string
}

export function WishlistItemCard({
  itemId,
  variantRef,
  product,
  unavailable = false,
  onRemoved,
  className,
}: Props) {
  const { localize } = useLocale()
  const { t } = useI18n()

  async function handleAddToCart() {
    if (!product) return
    try {
      await addItem(product.slug, 1, variantRef ?? undefined)
      await removeWishlistItem(itemId)
      toast.success(t('cart.toast.added'))
      onRemoved?.()
    } catch (e) {
      toast.error(String(e))
    }
  }

  async function handleRemove() {
    try {
      await removeWishlistItem(itemId)
      toast.success(t('wishlist.heart.remove'))
      onRemoved?.()
    } catch (e) {
      toast.error(String(e))
    }
  }

  if (unavailable || !product) {
    return (
      <article
        className={cn(
          'flex flex-col overflow-hidden rounded-lg border border-idl-border bg-idl-cream',
          className,
        )}
      >
        <div className="flex aspect-square items-center justify-center bg-idl-cream px-4 text-center text-sm text-idl-muted">
          {t('wishlist.item.unavailable')}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="font-medium text-idl-ink-soft">{t('wishlist.item.notInCatalog')}</p>
          {variantRef ? (
            <p className="mt-1 text-xs text-idl-muted">
              {t('product.variantLabel')} {variantRef}
            </p>
          ) : null}
          <div className="mt-4">
            <Button variant="secondary" onClick={() => void handleRemove()}>
              {t('common.remove')}
            </Button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-idl-border bg-idl-tech-panel',
        className,
      )}
    >
      <Link to={localize(`/prodotto/${product.slug}`)} className="block">
        <div className="aspect-square overflow-hidden bg-idl-cream">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              className="h-full w-full object-cover transition hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-idl-placeholder">
              {t('product.card.noImage')}
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link
          to={localize(`/prodotto/${product.slug}`)}
          className="font-medium text-idl-graphite hover:underline"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-base font-semibold text-idl-graphite">
          {formatMoney(product.priceCents, product.currency)}
        </p>
        {variantRef ? (
          <p className="mt-1 text-xs text-idl-muted">
            {t('product.variantLabel')} {variantRef}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            className="flex-1"
            onClick={() => void handleAddToCart()}
            disabled={product.inStock === false}
          >
            {t('wishlist.item.addToCart')}
          </Button>
          <Button variant="secondary" onClick={() => void handleRemove()}>
            {t('common.remove')}
          </Button>
        </div>
      </div>
    </article>
  )
}
