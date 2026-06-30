'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '@/utils/cn'
import { SiteImage } from '@/components/site/SiteImage'

type Props = {
  images: readonly string[]
  alt: string
  activeUrl?: string | null
  variant?: 'design' | 'technical'
}

export function ProductDetailGallery({ images, alt, activeUrl, variant = 'design' }: Props) {
  const base = useMemo(() => {
    if (images.length) return [...images]
    if (activeUrl) return [activeUrl]
    return []
  }, [images, activeUrl])

  const [selected, setSelected] = useState(base[0] ?? '')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const isDesign = variant === 'design'
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

  const current = selected || base[0]
  const lightboxUrl = base[lightboxIndex] ?? current

  if (!base.length) {
    return (
      <div
        className={cn(
          'flex aspect-square items-center justify-center text-sm',
          isDesign
            ? 'rounded bg-idl-design-elevated text-idl-design-dim'
            : 'rounded-xl border border-idl-tech-border bg-[#f7f8fa] text-idl-muted',
        )}
      >
        Anteprima prodotto
      </div>
    )
  }

  return (
    <>
      <div className="flex min-w-0 w-full flex-col gap-3.5 lg:sticky lg:top-[96px]">
        <button
          type="button"
          className={cn(
            'relative aspect-square w-full overflow-hidden focus:outline-none focus-visible:ring-2',
            isDesign
              ? 'rounded shadow-[0_0_90px_rgba(201, 162, 75,0.10)] focus-visible:ring-idl-glow/40'
              : 'rounded-xl border border-idl-tech-border bg-[#f7f8fa] focus-visible:ring-idl-amber/30',
          )}
          onClick={() => openLightbox(current)}
          aria-label="Ingrandisci immagine prodotto"
        >
          <SiteImage src={current} alt={alt} fill className="object-cover" sizes="50vw" priority />
        </button>

        {base.length > 1 ? (
          <div className={cn('grid grid-cols-4', isDesign ? 'gap-3' : 'gap-2.5')}>
            {base.map((url) => {
              const selectedThumb = url === current
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelected(url)}
                  onDoubleClick={() => openLightbox(url)}
                  className={cn(
                    'aspect-square overflow-hidden transition',
                    isDesign
                      ? cn(
                          'rounded-[3px] border',
                          selectedThumb
                            ? 'border-idl-glow/30'
                            : 'border-white/8 hover:border-white/20',
                        )
                      : cn(
                          'rounded-lg border bg-idl-tech-panel',
                          selectedThumb ? 'border-2 border-idl-amber' : 'border-idl-tech-border',
                        ),
                  )}
                  aria-label="Seleziona immagine"
                >
                  <div className="relative size-full">
                    <SiteImage src={url} alt="" fill className="object-cover" sizes="15vw" />
                  </div>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
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
      ) : null}
    </>
  )
}
