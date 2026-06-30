'use client'

import { memo, useMemo } from 'react'
import { Link } from '@/lib/navigation'
import { useLocale } from '@/context/locale-context'
import type { ProductCardDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { formatTechnicalProductRefLine } from '@/lib/technical-product-ref'
import { buildTechnicalCardSpecTags } from '@/lib/technical-card-spec-tags'
import {
  formatAvailabilityPrimaryLabel,
  getProductAvailabilityStatus,
  resolveAvailabilityData,
} from '@/lib/product-availability'
import { useTechnicalCatalogSelectionContext } from '@/context/technical-catalog-selection-context'
import { notify } from '@/lib/notify'
import { TECHNICAL_CATALOG_MAX_COMPARE } from '@/hooks/use-technical-catalog-selection'
import { cn } from '@/utils/cn'
import { SiteImage } from '../SiteImage'
import { HoverLift } from '@/components/motion'
import type { LocalePathFn } from '../sections/types'
import { TechnicalAddToCartButton } from './TechnicalAddToCartButton'
import { TechnicalCatalogSelectionCheckbox } from './TechnicalCatalogSelectionCheckbox'
import { CatalogProductCardSkeleton } from '../catalog/CatalogProductCardSkeleton'

function stockLabel(product: ProductCardDTO, locale: Parameters<typeof getProductAvailabilityStatus>[0]['locale']) {
  const availability = getProductAvailabilityStatus({
    availability: resolveAvailabilityData(product),
    locale,
  })
  const label = formatAvailabilityPrimaryLabel(availability)
  if (availability.status === 'available') {
    return { label: `● ${label}`, className: 'text-emerald-600' }
  }
  if (availability.status === 'orderable') {
    return { label: `● ${label}`, className: 'text-amber-700' }
  }
  return { label: `● ${label}`, className: 'text-idl-muted' }
}

type Props = {
  product: ProductCardDTO
  lp: LocalePathFn
  addLabel?: string
  showSelection?: boolean
}

export const TechnicalCatalogProductCard = memo(function TechnicalCatalogProductCard({
  product,
  lp,
  addLabel = 'Aggiungi',
  showSelection = true,
}: Props) {
  const { locale } = useLocale()
  const selection = useTechnicalCatalogSelectionContext()
  const stock = stockLabel(product, locale)
  const refLine = formatTechnicalProductRefLine(product)
  const tags = useMemo(
    () =>
      product.specTags ??
      buildTechnicalCardSpecTags({
        name: product.name,
        shortDescription: product.shortDescription,
      }),
    [product.name, product.shortDescription, product.specTags],
  )

  const checked = selection?.isSelected(product.slug) ?? false
  const selectionActive = selection?.selectionEnabled ?? false
  const checkboxDisabled = selectionActive && !checked && !(selection?.canSelectMore ?? false)

  function handleToggleSelection() {
    if (!selection) return
    if (!selection.selectionEnabled) {
      selection.setSelectionMode(true)
      selection.toggleProduct(product.slug)
      return
    }
    if (!checked && !selection.canSelectMore) {
      notify.message(`Puoi selezionare al massimo ${TECHNICAL_CATALOG_MAX_COMPARE} prodotti.`)
      return
    }
    selection.toggleProduct(product.slug)
  }

  return (
    <HoverLift className="h-full">
      <div
        className={cn(
          'flex h-full flex-col rounded-lg border bg-white p-4 transition hover:border-idl-muted hover:shadow-md dark:bg-idl-tech-panel',
          checked ? 'border-idl-amber ring-1 ring-idl-amber/30' : 'border-idl-tech-border',
        )}
      >
        <Link to={lp(`/prodotto/${product.slug}`)} className="block">
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-[11px] font-bold ${stock.className}`}>{stock.label}</span>
            {showSelection && selection ? (
              <TechnicalCatalogSelectionCheckbox
                checked={checked}
                disabled={checkboxDisabled}
                onChange={handleToggleSelection}
                productName={product.name}
                className={!selectionActive && !checked ? 'opacity-70' : undefined}
              />
            ) : showSelection ? (
              <span className="size-4 rounded border-[1.5px] border-idl-tech-chip-border" aria-hidden />
            ) : null}
          </div>
          <div className="relative mb-3 aspect-square overflow-hidden rounded bg-idl-tech-panel">
            {product.imageUrl ? (
              <SiteImage src={product.imageUrl} alt="" fill className="object-cover" sizes="25vw" />
            ) : null}
          </div>
          {refLine ? (
            <div className="font-mono text-[10.5px] text-idl-muted">{refLine}</div>
          ) : null}
          <div className="mt-1 line-clamp-2 min-h-[2lh] text-[13.5px] leading-snug font-semibold">{product.name}</div>
          {tags.length > 0 ? (
            <div className="mt-2.5 mb-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-idl-tech-chip-border bg-idl-tech-chip px-1.5 py-0.5 font-mono text-[10.5px] text-idl-graphite-2"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <div className="mb-3" />
          )}
        </Link>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-base font-extrabold">{formatMoney(product.priceCents, product.currency)}</span>
          <TechnicalAddToCartButton product={product} label={addLabel} />
        </div>
      </div>
    </HoverLift>
  )
})

type GridProps = {
  products: ReadonlyArray<ProductCardDTO>
  lp: LocalePathFn
  pendingSkeletonCount?: number
}

export function TechnicalCatalogProductGrid({ products, lp, pendingSkeletonCount = 0 }: GridProps) {
  const selection = useTechnicalCatalogSelectionContext()
  const bulkBarVisible = selection?.selectionEnabled && (selection?.selectedCount ?? 0) > 0

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', bulkBarVisible && 'pb-24')}>
      {products.map((product) => (
        <div key={product.slug} className="h-full">
          <TechnicalCatalogProductCard product={product} lp={lp} />
        </div>
      ))}
      {Array.from({ length: pendingSkeletonCount }).map((_, index) => (
        <div key={`technical-pending-${index}`} className="h-full" aria-hidden>
          <CatalogProductCardSkeleton variant="technical" />
        </div>
      ))}
    </div>
  )
}
