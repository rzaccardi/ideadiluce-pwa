'use client'

import { useEffect, useMemo } from 'react'
import { Link } from '@/lib/navigation'
import { ViewportPortal } from '@/components/ViewportPortal'
import { layers } from '@/lib/layering'
import type { ProductCardDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { formatTechnicalProductRefLine } from '@/lib/technical-product-ref'
import { buildTechnicalCardSpecTags } from '@/lib/technical-card-spec-tags'
import { cn } from '@/utils/cn'
import type { LocalePathFn } from '../sections/types'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  lp: LocalePathFn
  onClose: () => void
  className?: string
}

export function TechnicalCatalogCompareSheet({ products, lp, onClose, className }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const rows = useMemo(
    () =>
      products.map((product) => ({
        product,
        refLine: formatTechnicalProductRefLine(product),
        tags:
          product.specTags ??
          buildTechnicalCardSpecTags({
            name: product.name,
            shortDescription: product.shortDescription,
          }),
      })),
    [products],
  )

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const row of rows) {
      for (const tag of row.tags) {
        tagSet.add(tag)
      }
    }
    return Array.from(tagSet)
  }, [rows])

  return (
    <ViewportPortal open lockScroll>
      <div
        className={cn(
          'fixed inset-0 flex h-[100dvh] w-screen items-end justify-center sm:items-center',
          layers.dialog,
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="technical-compare-title"
      >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Chiudi confronto"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-idl-tech-border bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-idl-tech-border px-5 py-4">
          <div>
            <h2 id="technical-compare-title" className="text-lg font-extrabold text-idl-ink">
              Confronto prodotti
            </h2>
            <p className="mt-0.5 text-[13px] text-idl-muted">
              {products.length} prodotti selezionati
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xl text-idl-muted hover:bg-idl-tech-panel hover:text-idl-ink"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto p-5">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-idl-tech-border">
                <th className="pb-3 pr-4 font-semibold text-idl-muted">Caratteristica</th>
                {rows.map(({ product }) => (
                  <th key={product.slug} className="max-w-[180px] pb-3 pr-4 align-bottom font-semibold text-idl-ink">
                    <Link to={lp(`/prodotto/${product.slug}`)} className="line-clamp-2 hover:text-idl-amber">
                      {product.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-idl-tech-border">
                <td className="py-3 pr-4 text-idl-muted">Codice</td>
                {rows.map(({ product, refLine }) => (
                  <td key={product.slug} className="py-3 pr-4 font-mono text-[12px] text-idl-graphite-2">
                    {refLine ?? '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-idl-tech-border">
                <td className="py-3 pr-4 text-idl-muted">Prezzo</td>
                {rows.map(({ product }) => (
                  <td key={product.slug} className="py-3 pr-4 font-extrabold">
                    {formatMoney(product.priceCents, product.currency)}
                  </td>
                ))}
              </tr>
              {allTags.map((tag) => (
                <tr key={tag} className="border-b border-idl-tech-border">
                  <td className="py-3 pr-4 font-mono text-[12px] text-idl-muted">{tag}</td>
                  {rows.map(({ product, tags }) => (
                    <td key={product.slug} className="py-3 pr-4 text-idl-graphite-2">
                      {tags.includes(tag) ? '✓' : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </ViewportPortal>
  )
}
