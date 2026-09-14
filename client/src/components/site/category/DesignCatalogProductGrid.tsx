'use client'

import { memo } from 'react'
import { Link } from '@/lib/navigation'
import type { ProductCardDTO } from '@/types/dto'
import { ProductPrice } from '@/components/product/ProductPrice'
import { CatalogProductCardSkeleton } from '../catalog/CatalogProductCardSkeleton'
import { ProductIdentifierMeta } from '@/components/product/ProductIdentifierMeta'
import { ProductBrandMark } from '@/components/product/ProductBrandMark'
import type { LocalePathFn } from '../sections/types'
import { ProductCardLitMedia } from '@/components/product/ProductCardLitMedia'

type DesignProductCardMediaProps = {
  imageUrl: string | null
  hoverImageUrl?: string | null
  accesaImageUrl?: string | null
  slug?: string | null
  sizes: string
}

/** Foto a riempimento; luci globali o hover (desktop) verso accesa / ambientata. */
export function DesignProductCardMedia({
  imageUrl,
  hoverImageUrl,
  accesaImageUrl,
  slug,
  sizes,
}: DesignProductCardMediaProps) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-white">
      <ProductCardLitMedia
        imageUrl={imageUrl}
        hoverImageUrl={hoverImageUrl}
        accesaImageUrl={accesaImageUrl}
        slug={slug}
        sizes={sizes}
        imageClassName="object-cover"
      />
    </div>
  )
}

type Props = {
  product: ProductCardDTO
  lp: LocalePathFn
  to?: string
  hidePrice?: boolean
  discoverLabel?: string
  brandLabel?: string
}

export const DesignCatalogProductCard = memo(function DesignCatalogProductCard({
  product,
  lp,
  to,
  hidePrice = false,
  discoverLabel = 'Scopri →',
  brandLabel,
}: Props) {
  const fallbackLabel = brandLabel ?? product.categorySlug?.toUpperCase() ?? null

  return (
    <Link
      to={to ?? lp(`/prodotto/${product.slug}`)}
      className="group flex h-full flex-col overflow-hidden rounded border border-idl-path-design-border bg-white dark:bg-idl-tech-panel"
    >
      <DesignProductCardMedia
        imageUrl={product.imageUrl}
        hoverImageUrl={product.hoverImageUrl}
        accesaImageUrl={product.accesaImageUrl}
        slug={product.slug}
        sizes="(max-width:768px) 50vw, 33vw"
      />
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <ProductBrandMark
          brand={product.brand}
          fallbackLabel={fallbackLabel ?? '—'}
          size="sm"
          className="text-idl-brass"
        />
        <div className="mt-1 line-clamp-2 min-h-[2lh] font-serif text-[17px] leading-snug font-medium text-idl-ink sm:text-[19px]">
          {product.name}
        </div>
        <div className="mt-1 line-clamp-2 min-h-[2lh] text-xs leading-normal text-idl-ink-muted">
          {product.shortDescription ?? '\u00A0'}
        </div>
        <ProductIdentifierMeta
          product={product}
          includeBrand={false}
          className="mt-1 text-[10px] tracking-[0.04em] text-idl-ink-muted"
        />
        <div className="mt-auto flex items-start justify-between gap-2 pt-3">
          {hidePrice ? (
            <span className="text-[12.5px] font-bold text-idl-brass">{discoverLabel}</span>
          ) : (
            <>
              <ProductPrice
                netCents={product.priceCents}
                currency={product.currency}
                amountClassName="text-base font-bold text-idl-ink"
                captionClassName="text-[10.5px] font-medium text-idl-ink-muted"
              />
              <span className="hidden shrink-0 pt-0.5 text-[12.5px] font-bold text-idl-brass sm:inline">
                {discoverLabel}
              </span>
              <span className="pt-0.5 text-[12.5px] font-bold text-idl-brass sm:hidden">→</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
})

type GridProps = {
  products: ReadonlyArray<ProductCardDTO>
  lp: LocalePathFn
  pendingSkeletonCount?: number
}

export function DesignCatalogProductGrid({ products, lp, pendingSkeletonCount = 0 }: GridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <div key={product.slug} className="h-full">
          <DesignCatalogProductCard product={product} lp={lp} />
        </div>
      ))}
      {Array.from({ length: pendingSkeletonCount }).map((_, index) => (
        <div key={`design-pending-${index}`} className="h-full" aria-hidden>
          <CatalogProductCardSkeleton variant="design" />
        </div>
      ))}
    </div>
  )
}
