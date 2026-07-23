import { memo } from 'react'
import { Link } from '@/lib/navigation'
import type { ProductCardDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { SiteImage } from '../SiteImage'
import { HoverLift } from '@/components/motion'
import { CatalogProductCardSkeleton } from '../catalog/CatalogProductCardSkeleton'
import { ProductIdentifierMeta } from '@/components/product/ProductIdentifierMeta'
import { ProductBrandMark } from '@/components/product/ProductBrandMark'
import type { LocalePathFn } from '../sections/types'

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
    <HoverLift className="h-full">
      <Link
        to={to ?? lp(`/prodotto/${product.slug}`)}
        className="group flex h-full flex-col overflow-hidden rounded border border-idl-path-design-border bg-white transition hover:border-idl-brass hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] dark:bg-idl-tech-panel"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-idl-cream">
          {product.imageUrl ? (
            <SiteImage
              src={product.imageUrl}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              sizes="(max-width:768px) 50vw, 33vw"
            />
          ) : null}
        </div>
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
          <div className="mt-auto flex items-center justify-between pt-3">
            {hidePrice ? (
              <span className="text-[12.5px] font-bold text-idl-brass">{discoverLabel}</span>
            ) : (
              <>
                <span className="text-base font-bold text-idl-ink">{formatMoney(product.priceCents, product.currency)}</span>
                <span className="hidden text-[12.5px] font-bold text-idl-brass sm:inline">{discoverLabel}</span>
                <span className="text-[12.5px] font-bold text-idl-brass sm:hidden">→</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </HoverLift>
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
