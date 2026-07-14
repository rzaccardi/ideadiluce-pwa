'use client'

import { Link } from '@/lib/navigation'
import { useLocale } from '@/context/locale-context'
import type { ProductCategoryRefDTO, ProductDetailDTO, ProductVariantDTO } from '@/types/dto'
import { useI18n } from '@/hooks/use-i18n'
import type { ProductAvailabilityStatus } from '@/lib/product-availability'
import { ProductIdentifierMeta } from '@/components/product/ProductIdentifierMeta'
import { cn } from '@/utils/cn'

type Props = {
  product: Pick<
    ProductDetailDTO,
    | 'brand'
    | 'sku'
    | 'ced'
    | 'manufacturerCode'
    | 'defaultCode'
    | 'ean'
    | 'weightKg'
    | 'lengthMeters'
    | 'dimensions'
  >
  variant?: Pick<ProductVariantDTO, 'ean' | 'ced' | 'manufacturerCode'> | null
  categories?: ProductCategoryRefDTO[]
  availabilityLabel: string
  availabilityStatus?: ProductAvailabilityStatus
  availabilityDetail?: string
  restockAction?: React.ReactNode
  className?: string
}

export function ProductBuyBoxMeta({
  product,
  variant = null,
  categories = [],
  availabilityLabel,
  availabilityStatus,
  availabilityDetail,
  restockAction,
  className,
}: Props) {
  const { t } = useI18n()
  const { localize } = useLocale()
  const statusStyles: Record<ProductAvailabilityStatus, string> = {
    available: 'bg-emerald-50 text-emerald-800',
    orderable: 'bg-amber-50 text-amber-900',
    out_of_stock: 'bg-idl-cream text-idl-muted',
  }
  const badgeClass = availabilityStatus
    ? statusStyles[availabilityStatus]
    : 'bg-idl-cream text-idl-muted'

  return (
    <div className={cn('mt-4 space-y-2 text-sm text-idl-muted', className)}>
      <ProductIdentifierMeta
        product={product}
        variant={variant}
        includeBrand={false}
        layout="rows"
      />
      {categories.length > 0 ? (
        <dl>
          <dt className="mb-1 font-medium text-idl-ink-soft">{t('product.meta.categories')}</dt>
          <dd className="flex flex-wrap gap-1">
            {categories.map((cat, i) => (
              <span key={cat.slug}>
                {i > 0 ? <span className="text-idl-placeholder">, </span> : null}
                <Link
                  to={localize(`/negozio?category=${encodeURIComponent(cat.slug)}`)}
                  className="text-idl-graphite underline-offset-2 hover:underline"
                >
                  {cat.name}
                </Link>
              </span>
            ))}
          </dd>
        </dl>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className="sr-only">{t('product.meta.availability')}</span>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              badgeClass,
            )}
          >
            {availabilityLabel}
          </span>
          {availabilityDetail ? (
            <span className="text-xs text-idl-muted">{availabilityDetail}</span>
          ) : null}
          {restockAction}
        </div>
      </div>
    </div>
  )
}
