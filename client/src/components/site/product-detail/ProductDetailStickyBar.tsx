'use client'

import { addItem } from '@/features/cart'
import {
  buildCartAddHintFromCard,
  buildCartAddHintFromDetail,
} from '@/features/cart/cart-add-hint'
import { formatMoney } from '@/lib/format'
import type { ProductAvailabilityStatus } from '@/lib/product-availability'
import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'
import { SectionContainer } from '@/components/site/primitives'
import { cn } from '@/utils/cn'
import { SiteImage } from '@/components/site/SiteImage'
import { ProductIdentifierMeta, useProductIdentifierInline } from '@/components/product/ProductIdentifierMeta'

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
  addingLabel,
  variant = 'design',
  variantRef,
}: Props) {
  const isDesign = variant === 'design'
  const selectedVariant = variantRef
    ? product.variants.find((v) => v.ref === variantRef)
    : product.variants[0]
  const identifierLine = useProductIdentifierInline(product, selectedVariant, { includeBrand: false })
  const subtitle =
    identifierLine ??
    (product.specTags?.length ? product.specTags.slice(0, 3).join(' · ') : null) ??
    product.brand?.name ??
    null

  return (
    <div
      className={cn(
        'sticky bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom,0px)]',
        isDesign
          ? 'border-idl-border bg-idl-paper shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:bg-idl-tech-panel dark:shadow-[0_-8px_24px_rgba(0,0,0,0.35)]'
          : 'border-idl-tech-border bg-idl-tech-panel shadow-[0_-4px_16px_rgba(0,0,0,0.05)]',
      )}
    >
      <SectionContainer className="flex items-center justify-between gap-2 py-2.5 sm:gap-6 sm:py-3">
        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <div
            className={cn(
              'relative size-10 shrink-0 overflow-hidden rounded-lg border',
              isDesign
                ? 'border-idl-path-design-border bg-idl-cream dark:bg-idl-tech-chip'
                : 'border-idl-tech-border bg-idl-tech-panel',
            )}
          >
            {imageUrl ? (
              <SiteImage
                src={imageUrl}
                alt=""
                fill
                className={isDesign ? 'object-cover' : 'object-contain p-1'}
                sizes="40px"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <div
              className={cn(
                'truncate text-base leading-tight font-medium',
                isDesign ? 'font-serif text-idl-ink' : 'font-bold text-idl-graphite',
              )}
            >
              {product.name}
            </div>
            {identifierLine ? (
              <ProductIdentifierMeta
                product={product}
                variant={selectedVariant}
                includeBrand={false}
                className={cn(
                  'truncate text-[11px]',
                  isDesign ? 'text-idl-ink-muted' : 'text-idl-muted',
                )}
              />
            ) : (
              <div
                className={cn(
                  'truncate text-[11px]',
                  isDesign ? 'text-idl-ink-muted' : 'font-mono text-idl-muted',
                )}
              >
                {subtitle ?? '—'}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 sm:flex-none sm:shrink-0 sm:gap-5">
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
              'shrink-0 text-base font-bold sm:text-[22px]',
              isDesign ? 'font-serif text-idl-ink' : 'text-idl-graphite',
            )}
          >
            {formatMoney(displayPriceCents, product.currency)}
          </span>
          <button
            type="button"
            disabled={!canAddToCart || isAddingToCart}
            onClick={onAdd}
            className={cn(
              'min-w-0 flex-1 rounded-lg px-4 py-3 text-sm font-bold transition disabled:opacity-60 sm:flex-none sm:px-6 sm:py-3 sm:text-sm',
              isDesign
                ? 'bg-idl-glow text-idl-design hover:bg-idl-cta-glow-hover dark:bg-white dark:text-[#0c0c0d] dark:hover:bg-neutral-200'
                : 'bg-idl-amber text-white hover:bg-idl-cta-amber-hover dark:bg-white dark:text-[#0c0c0d] dark:hover:bg-neutral-200',
            )}
          >
            {isAddingToCart ? addingLabel : addLabel}
          </button>
        </div>
      </SectionContainer>
    </div>
  )
}

export type CartExtraAddItem = {
  product: ProductCardDTO
  quantity?: number
}

export function createAddToCartHandler(input: {
  product: ProductDetailDTO
  quantity: number
  variantRef: string | null
  galleryImages: readonly string[]
  setIsAddingToCart: (v: boolean) => void
  extraItems?: readonly CartExtraAddItem[]
}) {
  return () => {
    if (input.setIsAddingToCart) {
      input.setIsAddingToCart(true)
      const selected = input.variantRef
        ? input.product.variants.find((v) => v.ref === input.variantRef)
        : input.product.variants[0]
      void (async () => {
        await addItem(input.product.slug, input.quantity, input.variantRef, {
          feedback: {
            productName: input.product.name,
            imageUrl:
              selected?.imageUrl ?? input.galleryImages[0] ?? input.product.imageUrl,
            quantity: input.quantity,
          },
          productHint: buildCartAddHintFromDetail(input.product, input.variantRef),
        })
        for (const extra of input.extraItems ?? []) {
          if (!extra.product.slug) continue
          await addItem(extra.product.slug, extra.quantity ?? 1, undefined, {
            silent: true,
            productHint: buildCartAddHintFromCard(extra.product),
          })
        }
      })().finally(() => input.setIsAddingToCart(false))
    }
  }
}
