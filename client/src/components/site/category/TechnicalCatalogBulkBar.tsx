'use client'

import { useState } from 'react'
import type { ProductCardDTO } from '@/types/dto'
import { addItem } from '@/features/cart'
import { formatTechnicalProductRefLine } from '@/lib/technical-product-ref'
import {
  getProductAvailabilityStatus,
  resolveAvailabilityData,
} from '@/lib/product-availability'
import { useLocale } from '@/context/locale-context'
import { notify } from '@/lib/notify'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { cn } from '@/utils/cn'
import { useTechnicalCatalogSelectionContext } from '@/context/technical-catalog-selection-context'
import { TECHNICAL_CATALOG_MAX_COMPARE } from '@/hooks/use-technical-catalog-selection'
import type { LocalePathFn } from '../sections/types'
import { TechnicalCatalogCompareSheet } from './TechnicalCatalogCompareSheet'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  lp: LocalePathFn
}

export function TechnicalCatalogBulkBar({ products: _products, lp }: Props) {
  const { locale } = useLocale()
  const selection = useTechnicalCatalogSelectionContext()
  const [cartLoading, setCartLoading] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  if (!selection) return null

  const { selectedCount, selectedProducts, allVisibleSelected, selectAllVisible, clearSelection, selectionEnabled } =
    selection

  if (!selectionEnabled || selectedCount === 0) {
    return compareOpen ? (
      <TechnicalCatalogCompareSheet
        products={selectedProducts}
        lp={lp}
        onClose={() => setCompareOpen(false)}
      />
    ) : null
  }

  async function addSelectedToCart() {
    const addable = selectedProducts.filter((product) =>
      getProductAvailabilityStatus({
        availability: resolveAvailabilityData(product),
        locale,
      }).canAddToCart,
    )

    if (addable.length === 0) {
      notify.warning('Nessun prodotto selezionato è disponibile per l\'acquisto.')
      return
    }

    setCartLoading(true)
    let added = 0
    let failed = 0

    for (const product of addable) {
      try {
        await addItem(product.slug, 1, undefined, {
          productName: product.name,
          imageUrl: product.imageUrl,
        })
        added += 1
      } catch {
        failed += 1
      }
    }

    setCartLoading(false)

    if (added > 0) {
      notify.success(
        added === 1 ? '1 prodotto aggiunto al carrello' : `${added} prodotti aggiunti al carrello`,
      )
      clearSelection()
    }
    if (failed > 0) {
      notify.error(
        failed === 1
          ? '1 prodotto non è stato aggiunto al carrello'
          : `${failed} prodotti non sono stati aggiunti al carrello`,
      )
    }
  }

  async function copySelectedCodes() {
    const lines = selectedProducts
      .map((product) => formatTechnicalProductRefLine(product) ?? product.slug)
      .join('\n')

    try {
      await navigator.clipboard.writeText(lines)
      notify.success('Codici copiati negli appunti')
    } catch {
      notify.error('Impossibile copiare i codici')
    }
  }

  const canCompare = selectedCount >= 2

  return (
    <>
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-idl-tech-border bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm',
          'sm:px-6',
        )}
        role="region"
        aria-label="Azioni rapide sui prodotti selezionati"
      >
        <div className="mx-auto flex max-w-idl-wide flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-extrabold text-idl-ink">
              {selectedCount} selezionat{selectedCount === 1 ? 'o' : 'i'}
            </span>
            <span className="hidden text-[12px] text-idl-muted sm:inline">
              (max {TECHNICAL_CATALOG_MAX_COMPARE})
            </span>
            <button
              type="button"
              onClick={allVisibleSelected ? clearSelection : selectAllVisible}
              className="text-[12.5px] font-semibold text-idl-amber hover:underline"
            >
              {allVisibleSelected ? 'Deseleziona tutti' : 'Seleziona visibili'}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[12.5px] text-idl-muted hover:text-idl-ink"
            >
              Annulla
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copySelectedCodes()}
              className="rounded-md border border-idl-tech-border px-3 py-2 text-[12.5px] font-bold text-idl-ink transition hover:border-idl-ink"
            >
              Copia codici
            </button>
            <button
              type="button"
              disabled={!canCompare}
              onClick={() => setCompareOpen(true)}
              className="rounded-md border border-idl-tech-border px-3 py-2 text-[12.5px] font-bold text-idl-ink transition hover:border-idl-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confronta
            </button>
            <button
              type="button"
              disabled={cartLoading}
              onClick={() => void addSelectedToCart()}
              className="inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-md bg-idl-amber px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-idl-amber/90 disabled:opacity-60"
            >
              {cartLoading ? <LoadingSpinner className="h-3.5 w-3.5" /> : null}
              Aggiungi al carrello
            </button>
          </div>
        </div>
      </div>

      {compareOpen ? (
        <TechnicalCatalogCompareSheet
          products={selectedProducts}
          lp={lp}
          onClose={() => setCompareOpen(false)}
        />
      ) : null}
    </>
  )
}
