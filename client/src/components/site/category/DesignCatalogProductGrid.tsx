'use client'

import { memo } from 'react'
import { Link } from '@/lib/navigation'
import type { ProductCardDTO } from '@/types/dto'
import { ProductPrice } from '@/components/product/ProductPrice'
import { SiteImage } from '../SiteImage'
import { CatalogProductCardSkeleton } from '../catalog/CatalogProductCardSkeleton'
import { ProductIdentifierMeta } from '@/components/product/ProductIdentifierMeta'
import { ProductBrandMark } from '@/components/product/ProductBrandMark'
import type { LocalePathFn } from '../sections/types'
import { odooCatalogImageUrlsMatch } from '@/lib/odoo-catalog/media'
import { cn } from '@/utils/cn'

type DesignProductCardMediaProps = {
  imageUrl: string | null
  hoverImageUrl?: string | null
  sizes: string
}

/** Packshot su bianco; su hover (solo desktop) crossfade verso l’ambientata. */
export function DesignProductCardMedia({
  imageUrl,
  hoverImageUrl,
  sizes,
}: DesignProductCardMediaProps) {
  const hoverSrc =
    hoverImageUrl && !odooCatalogImageUrlsMatch(hoverImageUrl, imageUrl)
      ? hoverImageUrl
      : null

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-white">
      {imageUrl ? (
        <SiteImage
          src={imageUrl}
          alt=""
          fill
          className={cn(
            'object-contain',
            hoverSrc
              ? 'transition-opacity duration-500 ease-out [@media(hover:hover)]:group-hover:opacity-0'
              : null,
          )}
          sizes={sizes}
        />
      ) : null}
      {hoverSrc ? (
        <SiteImage
          src={hoverSrc}
          alt=""
          fill
          className={cn(
            'z-[1] object-cover opacity-0 transition-opacity duration-500 ease-out',
            '[@media(hover:hover)]:group-hover:opacity-100',
          )}
          sizes={sizes}
        />
      ) : null}
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
