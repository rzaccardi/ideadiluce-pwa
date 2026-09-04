'use client'

import { useState } from 'react'
import { Link } from '@/lib/navigation'
import { addItem, buildCartAddHintFromCard } from '@/features/cart'
import { formatMoney } from '@/lib/format'
import { extractProductDisplayTitle } from '@/lib/product-display-title'
import type { ProductRelatedDTO } from '@/types/dto'
import { SiteImage } from '@/components/site/SiteImage'
import { cn } from '@/utils/cn'
import type { LocalePathFn } from '@/components/site/sections/types'
import { useI18n } from '@/hooks/use-i18n'

type Props = {
  accessories: ReadonlyArray<ProductRelatedDTO>
  selectedSlugs: readonly string[]
  onToggle: (slug: string) => void
  lp: LocalePathFn
  layout?: 'compact' | 'section'
}

export function DesignAccessoryPicker({
  accessories,
  selectedSlugs,
  onToggle,
  lp,
  layout = 'compact',
}: Props) {
  const { t } = useI18n()
  const [addingSlug, setAddingSlug] = useState<string | null>(null)
  const selected = new Set(selectedSlugs)

  async function addAlone(item: ProductRelatedDTO) {
    if (!item.slug || addingSlug) return
    setAddingSlug(item.slug)
    try {
      await addItem(item.slug, 1, undefined, {
        feedback: { productName: item.name, imageUrl: item.imageUrl },
        productHint: buildCartAddHintFromCard(item),
      })
    } finally {
      setAddingSlug(null)
    }
  }

  if (accessories.length === 0) return null

  if (layout === 'compact') {
    return (
      <div className="mb-5 rounded-lg border border-idl-path-design-border bg-idl-paper/80 px-3.5 py-3.5">
        <div className="mb-2.5 text-[11px] font-semibold tracking-[0.16em] text-idl-brass uppercase">
          {t('product.accessories.compactTitle')}
        </div>
        <ul className="space-y-2">
          {accessories.map((item) => {
            const checked = selected.has(item.slug)
            const title = extractProductDisplayTitle(item.name).title
            return (
              <li key={item.slug}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md border px-2.5 py-2 transition',
                    checked
                      ? 'border-idl-brass bg-idl-cream/80'
                      : 'border-transparent hover:border-idl-path-design-border',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(item.slug)}
                    className="size-4 shrink-0 accent-idl-brass"
                  />
                  <span className="relative size-11 shrink-0 overflow-hidden rounded border border-idl-path-design-border bg-white">
                    {item.imageUrl ? (
                      <SiteImage src={item.imageUrl} alt="" fill className="object-cover" sizes="44px" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[13.5px] font-medium leading-snug text-idl-ink">
                      {title}
                    </span>
                    <Link
                      to={lp(`/prodotto/${item.slug}`)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11.5px] text-idl-brass hover:underline"
                    >
                      {t('product.accessories.viewProduct')}
                    </Link>
                  </span>
                  <span className="shrink-0 text-[13.5px] font-semibold text-idl-ink">
                    {formatMoney(item.priceCents, item.currency)}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {accessories.map((item) => {
        const checked = selected.has(item.slug)
        const title = extractProductDisplayTitle(item.name).title
        const isAdding = addingSlug === item.slug
        return (
          <article
            key={item.slug}
            className={cn(
              'flex flex-col overflow-hidden rounded-[3px] border bg-white transition dark:bg-idl-tech-panel',
              checked ? 'border-idl-brass' : 'border-idl-path-design-border',
            )}
          >
            <Link to={lp(`/prodotto/${item.slug}`)} className="relative aspect-[4/5] bg-white dark:bg-idl-tech-panel">
              {item.imageUrl ? (
                <SiteImage src={item.imageUrl} alt="" fill className="object-cover" sizes="33vw" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-idl-ink-muted">—</div>
              )}
            </Link>
            <div className="flex flex-1 flex-col gap-3 p-3.5">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.slug)}
                  className="mt-1 size-4 shrink-0 accent-idl-brass"
                />
                <span className="min-w-0">
                  <span className="line-clamp-2 font-serif text-[17px] leading-snug font-medium text-idl-ink">
                    {title}
                  </span>
                  <span className="mt-1 block text-[15px] font-bold text-idl-ink">
                    {formatMoney(item.priceCents, item.currency)}
                  </span>
                </span>
              </label>
              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isAdding}
                  onClick={() => void addAlone(item)}
                  className="flex-1 rounded-lg border border-idl-path-design-border px-3 py-2 text-[12.5px] font-semibold text-idl-ink transition hover:border-idl-brass hover:text-idl-brass disabled:opacity-60"
                >
                  {isAdding ? t('product.addingToCart') : t('product.accessories.addOn')}
                </button>
                <Link
                  to={lp(`/prodotto/${item.slug}`)}
                  className="rounded-lg px-3 py-2 text-[12.5px] font-semibold text-idl-brass hover:underline"
                >
                  {t('product.accessories.viewProduct')}
                </Link>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
