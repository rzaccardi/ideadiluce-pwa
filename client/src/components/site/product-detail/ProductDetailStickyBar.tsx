'use client'

import { addItem } from '@/features/cart'
import { formatMoney } from '@/lib/format'
import type { ProductAvailabilityStatus } from '@/lib/product-availability'
import type { ProductDetailDTO } from '@/types/dto'
import { SectionContainer } from '@/components/site/primitives'
import { cn } from '@/utils/cn'
import { SiteImage } from '@/components/site/SiteImage'
import { buildProductMetaLine, buildProductSubtitle } from './shared'

type Props = {
  product: ProductDetailDTO
  displayPriceCents: number
  imageUrl: string | null
  variantRef: string | null
  quantity: number
  availabilityLabel: string
  availabilityDetail?: string
  availabilityStatus?: ProductAvailabilityStatus
  canAddToCart: boolean
  isAddingToCart: boolean
  onAdd: () => void
  addLabel: string
  addLabelShort?: string
  addingLabel: string
  variant?: 'design' | 'technical'
}

export function ProductDetailStickyBar({
  product,
  displayPriceCents,
  imageUrl,
  availabilityLabel,
  availabilityDetail,
  availabilityStatus,
  canAddToCart,
  isAddingToCart,
  onAdd,
  addLabel,
  addLabelShort,
  addingLabel,
  variant = 'design',
}: Props) {
  const isDesign = variant === 'design'
  const subtitle = buildProductSubtitle(product)
  const meta = buildProductMetaLine(product)

  return (
    <div
      className={cn(
        'sticky bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom,0px)]',
        isDesign
          ? 'border-idl-glow/20 bg-[#0c0c0d]'
          : 'border-idl-tech-border bg-idl-tech-panel shadow-[0_-4px_16px_rgba(0,0,0,0.05)]',
      )}
    >
      <SectionContainer className="flex items-center justify-between gap-2 py-2.5 sm:gap-6 sm:py-3">
        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <div
            className={cn(
              'relative size-10 shrink-0 overflow-hidden rounded-lg border',
              isDesign ? 'border-white/10 bg-idl-design-elevated' : 'border-idl-tech-border bg-idl-tech-panel',
            )}
          >
            {imageUrl ? <SiteImage src={imageUrl} alt="" fill className="object-cover" sizes="40px" /> : null}
          </div>
          <div className="min-w-0">
            <div
              className={cn(
                'truncate text-base leading-tight font-medium',
                isDesign ? 'font-serif text-idl-design-fg' : 'font-bold text-idl-graphite',
              )}
            >
              {product.name}
            </div>
            <div
              className={cn(
                'truncate text-[11px]',
                isDesign ? 'text-idl-design-dim' : 'font-mono text-idl-muted',
              )}
            >
              {subtitle ?? meta ?? product.brand?.name ?? '—'}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none sm:shrink-0 sm:gap-5">
          {!isDesign && availabilityLabel ? (
            <div className="hidden flex-col items-end sm:flex">
              <span
                className={cn(
                  'text-sm font-bold',
                  availabilityStatus === 'available'
                    ? 'text-emerald-600'
                    : availabilityStatus === 'orderable'
                      ? 'text-amber-700'
                      : 'text-idl-muted',
                )}
              >
                {availabilityLabel}
              </span>
              {availabilityDetail ? (
                <span className="max-w-[220px] truncate text-xs text-idl-muted">{availabilityDetail}</span>
              ) : null}
            </div>
          ) : null}
          <span
            className={cn(
              'shrink-0 text-lg font-bold sm:text-[22px]',
              isDesign ? 'font-serif text-idl-design-fg' : 'text-idl-graphite',
            )}
          >
            {formatMoney(displayPriceCents, product.currency)}
          </span>
          <button
            type="button"
            disabled={!canAddToCart || isAddingToCart}
            onClick={onAdd}
            className={cn(
              'min-w-0 shrink rounded-lg px-3 py-2.5 text-xs font-bold transition disabled:opacity-60 sm:px-6 sm:py-3 sm:text-sm',
              isDesign
                ? 'bg-idl-glow text-idl-design hover:bg-[#f7bd6f]'
                : 'bg-idl-amber text-white hover:bg-[#b08e3e]',
            )}
          >
            {isAddingToCart ? (
              addingLabel
            ) : (
              <>
                <span className="sm:hidden">{addLabelShort ?? addLabel}</span>
                <span className="hidden sm:inline">{addLabel}</span>
              </>
            )}
          </button>
        </div>
      </SectionContainer>
    </div>
  )
}

export function createAddToCartHandler(input: {
  product: ProductDetailDTO
  quantity: number
  variantRef: string | null
  galleryImages: readonly string[]
  setIsAddingToCart: (v: boolean) => void
}) {
  return () => {
    if (input.setIsAddingToCart) {
      input.setIsAddingToCart(true)
      void addItem(input.product.slug, input.quantity, input.variantRef, {
        productName: input.product.name,
        imageUrl: input.galleryImages[0] ?? input.product.imageUrl,
        quantity: input.quantity,
      }).finally(() => input.setIsAddingToCart(false))
    }
  }
}
