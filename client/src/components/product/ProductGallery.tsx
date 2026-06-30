'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ViewportPortal } from '@/components/ViewportPortal'
import { layers } from '@/lib/layering'
import { cn } from '@/utils/cn'

type Props = {
  images: readonly string[]
  alt: string
  activeUrl?: string | null
}

export function ProductGallery({ images, alt, activeUrl }: Props) {
  const base = useMemo(() => {
    if (images.length) return [...images]
    if (activeUrl) return [activeUrl]
    return []
  }, [images, activeUrl])
  const [selected, setSelected] = useState(base[0] ?? '')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const baseKey = base.join('\0')

  useEffect(() => {
    if (activeUrl && base.includes(activeUrl)) {
      setSelected(activeUrl)
      return
    }
    if (base.length && !base.includes(selected)) {
      setSelected(base[0])
    }
  }, [activeUrl, baseKey, base, selected])

  const openLightbox = useCallback(
    (url: string) => {
      const idx = base.indexOf(url)
      setLightboxIndex(idx >= 0 ? idx : 0)
      setLightboxOpen(true)
    },
    [base],
  )

  const goPrev = useCallback(() => {
    if (!base.length) return
    setLightboxIndex((i) => (i - 1 + base.length) % base.length)
  }, [base.length])

  const goNext = useCallback(() => {
    if (!base.length) return
    setLightboxIndex((i) => (i + 1) % base.length)
  }, [base.length])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, goPrev, goNext])

  if (!base.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-idl-cream text-idl-placeholder">
        Anteprima
      </div>
    )
  }

  const current = selected || base[0]
  const lightboxUrl = base[lightboxIndex] ?? current

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          className="aspect-square w-full overflow-hidden rounded-xl bg-idl-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          onClick={() => openLightbox(current)}
          aria-label="Ingrandisci immagine prodotto"
        >
          <img src={current} alt={alt} className="h-full w-full object-cover" />
        </button>
        {base.length > 1 ? (
          <ul className="flex flex-wrap gap-2">
            {base.map((url) => (
              <li key={url}>
                <button
                  type="button"
                  onClick={() => setSelected(url)}
                  onDoubleClick={() => openLightbox(url)}
                  className={cn(
                    'h-16 w-16 overflow-hidden rounded-lg border-2 transition',
                    current === url ? 'border-zinc-900' : 'border-transparent hover:border-idl-border-strong',
                  )}
                  aria-label="Seleziona immagine"
                >
                  <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <ViewportPortal open={lightboxOpen} lockScroll>
        <div
          className={cn(
            'fixed inset-0 flex h-[100dvh] w-screen items-center justify-center bg-black/80 p-4',
            layers.dialog,
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Galleria prodotto"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-idl-tech-panel/10 px-3 py-1 text-sm text-white hover:bg-idl-tech-panel/20"
            onClick={() => setLightboxOpen(false)}
          >
            Chiudi
          </button>
          {base.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-idl-tech-panel/10 px-3 py-2 text-white hover:bg-idl-tech-panel/20 sm:left-4"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                aria-label="Immagine precedente"
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-idl-tech-panel/10 px-3 py-2 text-white hover:bg-idl-tech-panel/20 sm:right-4"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                aria-label="Immagine successiva"
              >
                ›
              </button>
            </>
          ) : null}
          <img
            src={lightboxUrl}
            alt={alt}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </ViewportPortal>
    </>
  )
}
