'use client'

import { useState } from 'react'
import type { ProductCardDTO } from '@/types/dto'
import { addItem } from '@/features/cart'
import { buildCartAddHintFromCard } from '@/features/cart/cart-add-hint'
import {
  getProductAvailabilityStatus,
  resolveAvailabilityData,
} from '@/lib/product-availability'
import { useLocale } from '@/context/locale-context'
import { notify } from '@/lib/notify'
import { buildProductPageUrl } from '@/lib/seo'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { cn } from '@/utils/cn'
import { useTechnicalCatalogSelectionContext } from '@/context/technical-catalog-selection-context'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
}

export function TechnicalCatalogBulkBar({ products: _products }: Props) {
  const { locale } = useLocale()
  const selection = useTechnicalCatalogSelectionContext()
  const [cartLoading, setCartLoading] = useState(false)

  if (!selection) return null

  const { selectedCount, selectedProducts, allVisibleSelected, selectAllVisible, clearSelection, selectionEnabled } =
    selection

  if (!selectionEnabled || selectedCount === 0) {
    return null
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
          feedback: {
            productName: product.name,
            imageUrl: product.imageUrl,
          },
          productHint: buildCartAddHintFromCard(product),
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

  async function copySelectedProductLinks() {
    const links = selectedProducts
      .map((product) => buildProductPageUrl(product.slug, locale))
      .join('\n')

    try {
      await navigator.clipboard.writeText(links)
      notify.success('Lista prodotti copiata negli appunti')
    } catch {
      notify.error('Impossibile copiare la lista prodotti')
    }
  }

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
              onClick={() => void copySelectedProductLinks()}
              className="rounded-md border border-idl-tech-border px-3 py-2 text-[12.5px] font-bold text-idl-ink transition hover:border-idl-ink"
            >
              Copia lista prodotti
            </button>
            <button
              type="button"
              disabled={cartLoading}
              onClick={() => void addSelectedToCart()}
              className="inline-flex min-w-[120px] items-center justify-center gap-1.5 rounded-md bg-idl-amber px-4 py-2 text-[12.5px] font-bold text-white dark:text-idl-design transition hover:bg-idl-amber/90 disabled:opacity-60"
            >
              {cartLoading ? <LoadingSpinner className="h-3.5 w-3.5" /> : null}
              Aggiungi al carrello
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
