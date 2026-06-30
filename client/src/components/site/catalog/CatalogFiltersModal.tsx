'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useIsClient } from '@/hooks/use-is-client'
import { transitionBase } from '@/lib/motion/presets'
import { layers } from '@/lib/layering'
import { cn } from '@/utils/cn'
import { CatalogFilterSidebar } from './CatalogFilterSidebar'
import type { ComponentProps } from 'react'

type SidebarProps = ComponentProps<typeof CatalogFilterSidebar>

type Props = SidebarProps & {
  open: boolean
  onClose: () => void
  totalProducts: number
}

export function CatalogFiltersModal({
  open,
  onClose,
  totalProducts,
  ...sidebarProps
}: Props) {
  const isClient = useIsClient()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!isClient) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="catalog-filters-backdrop"
            type="button"
            aria-label="Chiudi filtri"
            className={cn('fixed inset-0 bg-idl-backdrop lg:hidden', layers.modal)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitionBase}
            onClick={onClose}
          />

          <motion.section
            key="catalog-filters-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-filters-modal-title"
            className={cn(
              'fixed inset-x-0 bottom-0 flex max-h-[min(96dvh,100%)] flex-col rounded-t-[20px] border border-idl-tech-border border-b-0 bg-idl-tech-panel shadow-2xl shadow-zinc-950/20 lg:hidden',
              layers.modal,
            )}
            initial={reduceMotion ? false : { y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={transitionBase}
          >
            <div className="flex justify-center pt-2.5 pb-1" aria-hidden>
              <span className="h-1 w-10 rounded-full bg-idl-tech-border" />
            </div>

            <div className="flex shrink-0 items-center justify-between border-b border-idl-tech-border px-4 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-[13px] font-semibold text-idl-muted hover:text-idl-ink"
                aria-label="Chiudi filtri"
              >
                ✕
              </button>
              <h2 id="catalog-filters-modal-title" className="text-[15px] font-extrabold tracking-tight text-idl-ink">
                Filtri
              </h2>
              <button
                type="button"
                onClick={sidebarProps.onReset}
                className="text-[12.5px] font-bold text-idl-amber"
              >
                Azzera
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="rounded-[14px] border border-idl-tech-border bg-idl-tech-panel p-4">
                <CatalogFilterSidebar {...sidebarProps} showHeader={false} />
              </div>
            </div>

            <div className="shrink-0 border-t border-idl-tech-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg bg-idl-ink px-4 py-3 text-[14px] font-bold text-white transition hover:bg-[#2a2d35]"
              >
                Mostra {totalProducts.toLocaleString('it-IT')} prodotti
              </button>
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
