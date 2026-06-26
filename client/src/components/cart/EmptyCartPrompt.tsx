'use client'

import { useEffect } from 'react'
import { Link } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { catalogStore, fetchCategories, fetchProducts } from '@/features/catalog'
import { Button } from '@/components/Button'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductGridSkeleton } from '@/components/Skeleton'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  className?: string
  /** Layout compatto per mini-carrello e checkout. */
  compact?: boolean
  /** Mostra prodotti in evidenza (solo pagina carrello). */
  showSuggestions?: boolean
  onNavigate?: () => void
}

function CartEmptyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cn('mx-auto text-idl-border-strong', className)}
      fill="none"
    >
      <path
        d="M14 14h26l-2.5 13a3 3 0 0 1-3 2.4H18.2a3 3 0 0 1-2.9-2.5L14.8 10H10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="20" cy="38" r="2.5" fill="currentColor" />
      <circle cx="34" cy="38" r="2.5" fill="currentColor" />
      <path d="M10 10h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

export function EmptyCartPrompt({ className, compact = false, showSuggestions = false, onNavigate }: Props) {
  const { t } = useI18n()
  const cat = useSnapshot(catalogStore)

  useEffect(() => {
    if (!showSuggestions) return
    void fetchCategories()
    void fetchProducts({ categorySlug: undefined, pageSize: 3 })
  }, [showSuggestions])

  const title = t('cart.empty.title')
  const description = t('cart.empty.description')

  const actions = (
    <div className={cn('flex flex-wrap justify-center gap-3', compact ? 'mt-4' : 'mt-6')}>
      <Link to="/catalog" onClick={onNavigate}>
        <Button>{t('cart.empty.browseCatalog')}</Button>
      </Link>
      {!compact ? (
        <Link to="/" onClick={onNavigate}>
          <Button variant="secondary">{t('cart.empty.backHome')}</Button>
        </Link>
      ) : null}
    </div>
  )

  const body = (
    <>
      <CartEmptyIcon className={compact ? 'h-12 w-12' : 'h-16 w-16'} />
      <h2 className={cn('font-semibold text-idl-graphite', compact ? 'mt-3 text-base' : 'mt-4 text-lg')}>
        {title}
      </h2>
      <p className={cn('text-idl-muted', compact ? 'mt-1 text-sm' : 'mt-2 text-sm max-w-md mx-auto')}>
        {description}
      </p>
      {actions}
      {!compact && cat.categories.length > 0 ? (
        <div className="mt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-idl-muted">
            {t('cart.empty.popularCategories')}
          </p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {cat.categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link
                  to={`/catalog?category=${encodeURIComponent(c.slug)}`}
                  onClick={onNavigate}
                  className="inline-block rounded-full border border-idl-border bg-white px-3 py-1 text-sm text-idl-ink-soft hover:border-idl-border-strong"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  )

  if (showSuggestions) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-dashed border-idl-border bg-white px-6 py-10 text-center">
          {body}
        </div>
        <section className="mt-10">
          <h3 className="text-base font-medium text-idl-graphite">{t('cart.empty.featured')}</h3>
          <p className="mt-1 text-sm text-idl-muted">{t('home.featuredDescription')}</p>
          <div className="mt-6">
            {cat.isLoading && cat.products.length === 0 ? (
              <ProductGridSkeleton count={3} />
            ) : (
              <ProductGrid products={cat.products} emptyMessage={t('product.grid.empty')} />
            )}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'text-center',
        compact
          ? 'rounded-xl border border-dashed border-idl-border bg-idl-cream/80 px-4 py-5'
          : 'rounded-xl border border-dashed border-idl-border bg-white px-6 py-12',
        className,
      )}
    >
      {body}
    </div>
  )
}
