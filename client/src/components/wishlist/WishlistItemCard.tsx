'use client'

import { Link } from '@/lib/navigation'
import { toast } from 'sonner'
import type { ProductCardDTO } from '@/types/dto'
import { useLocale } from '@/context/locale-context'
import { addItem } from '@/features/cart'
import { buildCartAddHintFromCard } from '@/features/cart/cart-add-hint'
import { removeWishlistItem } from '@/features/wishlist'
import { ProductPrice } from '@/components/product/ProductPrice'
import { Button } from '@/components/Button'
import { IdlMediaPlaceholder } from '@/components/site/IdlMediaPlaceholder'
import { SiteImage } from '@/components/site/SiteImage'
import { useI18n } from '@/hooks/use-i18n'
import { productCardObjectFitClass } from '@/lib/product-image-fit'
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
      await addItem(product.slug, 1, variantRef ?? undefined, {
        productHint: buildCartAddHintFromCard(product, variantRef),
      })
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

  const imageFitClass = productCardObjectFitClass(product)

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-idl-border bg-idl-tech-panel',
        className,
      )}
    >
      <Link to={localize(`/prodotto/${product.slug}`)} className="block">
        <div className="relative aspect-square overflow-hidden bg-idl-cream">
          {product.imageUrl ? (
            <SiteImage
              src={product.imageUrl}
              alt=""
              fill
              sizes="200px"
              className={cn(
                'transition hover:scale-[1.02]',
                imageFitClass,
                imageFitClass === 'object-contain' && 'p-3',
              )}
            />
          ) : (
            <IdlMediaPlaceholder fill />
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
        <ProductPrice
          netCents={product.priceCents}
          currency={product.currency}
          className="mt-1"
          amountClassName="text-base font-semibold text-idl-graphite"
          captionClassName="text-xs text-idl-muted"
        />
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
