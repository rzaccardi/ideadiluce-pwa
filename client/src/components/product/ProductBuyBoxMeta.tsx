'use client'

import { Link } from '@/lib/navigation'
import { useLocale } from '@/context/locale-context'
import type { ProductCategoryRefDTO } from '@/types/dto'
import { useI18n } from '@/hooks/use-i18n'
import type { ProductAvailabilityStatus } from '@/lib/product-availability'
import { cn } from '@/utils/cn'

type Props = {
  sku: string | null
  categories?: ProductCategoryRefDTO[]
  availabilityLabel: string
  availabilityStatus?: ProductAvailabilityStatus
  availabilityDetail?: string
  restockAction?: React.ReactNode
  className?: string
}

export function ProductBuyBoxMeta({
  sku,
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

  if (!sku && categories.length === 0) return null

  return (
    <dl className={cn('mt-4 space-y-2 text-sm text-idl-muted', className)}>
      {sku ? (
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-idl-ink-soft">{t('product.meta.sku')}</dt>
          <dd>{sku}</dd>
        </div>
      ) : null}
      {categories.length > 0 ? (
        <div>
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
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <dt className="sr-only">{t('product.meta.availability')}</dt>
        <dd className="flex flex-wrap items-center gap-2">
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
        </dd>
      </div>
    </dl>
  )
}
