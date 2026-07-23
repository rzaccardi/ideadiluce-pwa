'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useIsClient } from '@/hooks/use-is-client'
import { layers } from '@/lib/layering'
import { cn } from '@/utils/cn'
import { SiteImage } from '@/components/site/SiteImage'
import type { ProductGalleryItemDTO, ProductGalleryTagDTO } from '@/types/dto'

function LightboxCloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

function LightboxChevronIcon({ direction, className }: { direction: 'left' | 'right'; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path
        d={direction === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6 6 6'}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

const lightboxControlClass =
  'flex size-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50'

/** Ordine tab editoriale (solo tag con almeno un media). */
export const GALLERY_TAG_ORDER: ProductGalleryTagDTO[] = [
  'foto',
  'attacco',
  'misure',
  'accesa',
  'applicazione',
  'ambiente',
  'dettaglio',
  'certificazione',
]

const GALLERY_TAG_LABEL: Record<string, string> = {
  foto: 'Foto',
  attacco: 'Attacco',
  misure: 'Misure',
  accesa: 'Accesa',
  applicazione: 'Applicazione',
  ambiente: 'Ambiente',
  dettaglio: 'Dettaglio',
  certificazione: 'Certificazione',
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      const embed = u.pathname.match(/\/embed\/([^/]+)/)
      if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}`
    }
  } catch {
    return null
  }
  return null
}

function vimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('vimeo.com')) return null
    const id = u.pathname.split('/').filter(Boolean).pop()
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
  } catch {
    return null
  }
}

function videoEmbedSrc(url: string): string | null {
  return youtubeEmbedUrl(url) ?? vimeoEmbedUrl(url)
}

type Props = {
  /** Gallery strutturata (preferita). */
  gallery?: readonly ProductGalleryItemDTO[]
  /** Fallback compat: solo URL immagine. */
  images?: readonly string[]
  alt: string
  activeUrl?: string | null
  variant?: 'design' | 'technical'
}

export function ProductDetailGallery({
  gallery,
  images,
  alt,
  activeUrl,
  variant = 'design',
}: Props) {
  const items = useMemo((): ProductGalleryItemDTO[] => {
    if (gallery?.length) return [...gallery]
    if (images?.length) {
      return images.map((url) => ({ type: 'image' as const, tag: 'foto' as const, url, alt: '' }))
    }
    if (activeUrl) {
      return [{ type: 'image', tag: 'foto', url: activeUrl, alt: '' }]
    }
    return []
  }, [gallery, images, activeUrl])

  const tagsPresent = useMemo(() => {
    const present = new Set(items.map((i) => i.tag || 'foto'))
    const ordered = GALLERY_TAG_ORDER.filter((t) => present.has(t))
    for (const t of present) {
      if (!ordered.includes(t as ProductGalleryTagDTO)) ordered.push(t)
    }
    return ordered
  }, [items])

  const [activeTag, setActiveTag] = useState<string>(tagsPresent[0] ?? 'foto')
  const filtered = useMemo(
    () => items.filter((i) => (i.tag || 'foto') === activeTag),
    [items, activeTag],
  )
  const displayItems = filtered.length ? filtered : items

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const isClient = useIsClient()
  const isDesign = variant === 'design'

  useEffect(() => {
    if (tagsPresent.length && !tagsPresent.includes(activeTag)) {
      setActiveTag(tagsPresent[0])
    }
  }, [tagsPresent, activeTag])

  useEffect(() => {
    if (activeUrl) {
      const idx = displayItems.findIndex((i) => i.url === activeUrl)
      if (idx >= 0) {
        setSelectedIndex(idx)
        return
      }
    }
    setSelectedIndex(0)
  }, [activeUrl, activeTag, displayItems])

  const current = displayItems[selectedIndex] ?? displayItems[0]
  const lightboxItem = displayItems[lightboxIndex] ?? current

  const openLightbox = useCallback(
    (index: number) => {
      setLightboxIndex(index)
      setLightboxOpen(true)
    },
    [],
  )

  const goPrev = useCallback(() => {
    if (!displayItems.length) return
    setLightboxIndex((i) => (i - 1 + displayItems.length) % displayItems.length)
  }, [displayItems.length])

  const goNext = useCallback(() => {
    if (!displayItems.length) return
    setLightboxIndex((i) => (i + 1) % displayItems.length)
  }, [displayItems.length])

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

  useEffect(() => {
    if (!lightboxOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [lightboxOpen])

  if (!items.length) {
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

  const currentAlt = current?.alt?.trim() || alt
  const embedSrc =
    current?.type === 'video' && current.url ? videoEmbedSrc(current.url) : null

  return (
    <>
      <div className="flex min-w-0 w-full flex-col gap-3.5 lg:sticky lg:top-[96px]">
        {tagsPresent.length > 1 ? (
          <div
            className={cn(
              'flex flex-wrap gap-1.5',
              isDesign ? 'border-b border-white/10 pb-2' : 'border-b border-idl-tech-border pb-2',
            )}
            role="tablist"
            aria-label="Categorie gallery"
          >
            {tagsPresent.map((tag) => {
              const selected = tag === activeTag
              return (
                <button
                  key={tag}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTag(tag)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium transition',
                    isDesign
                      ? selected
                        ? 'text-idl-glow'
                        : 'text-idl-design-dim hover:text-idl-design-fg'
                      : selected
                        ? 'rounded-md bg-idl-amber/15 text-idl-ink'
                        : 'rounded-md text-idl-muted hover:text-idl-ink',
                  )}
                >
                  {GALLERY_TAG_LABEL[tag] ?? tag}
                </button>
              )
            })}
          </div>
        ) : null}

        <button
          type="button"
          className={cn(
            'relative aspect-square w-full overflow-hidden focus:outline-none focus-visible:ring-2',
            isDesign
              ? 'rounded shadow-[0_0_90px_rgba(120, 120, 125,0.10)] focus-visible:ring-idl-glow/40'
              : 'rounded-xl border border-idl-tech-border bg-[#f7f8fa] focus-visible:ring-idl-amber/30',
          )}
          onClick={() => {
            if (current?.type === 'image') openLightbox(selectedIndex)
          }}
          aria-label={
            current?.type === 'video' ? 'Video prodotto' : 'Ingrandisci immagine prodotto'
          }
        >
          {current?.type === 'video' ? (
            embedSrc ? (
              <iframe
                src={embedSrc}
                title={currentAlt}
                className="absolute inset-0 size-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/80 text-sm text-white"
                onClick={(e) => e.stopPropagation()}
              >
                Apri video
              </a>
            )
          ) : current ? (
            <SiteImage
              src={current.url}
              alt={currentAlt}
              fill
              className="object-cover"
              sizes="50vw"
              priority
            />
          ) : null}
        </button>

        {displayItems.length > 1 ? (
          <div className={cn('grid grid-cols-4', isDesign ? 'gap-3' : 'gap-2.5')}>
            {displayItems.map((item, idx) => {
              const selectedThumb = idx === selectedIndex
              return (
                <button
                  key={`${item.tag}-${item.url}-${idx}`}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  onDoubleClick={() => item.type === 'image' && openLightbox(idx)}
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
                  aria-label={
                    item.type === 'video' ? 'Seleziona video' : 'Seleziona immagine'
                  }
                >
                  <div className="relative size-full">
                    {item.type === 'video' ? (
                      <div className="flex size-full items-center justify-center bg-black/70 text-[10px] font-medium uppercase tracking-wide text-white">
                        Video
                      </div>
                    ) : (
                      <SiteImage
                        src={item.url}
                        alt={item.alt || ''}
                        fill
                        className="object-cover"
                        sizes="15vw"
                      />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {lightboxOpen && isClient && lightboxItem?.type === 'image'
        ? createPortal(
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
                className={cn(lightboxControlClass, 'absolute right-4 top-4')}
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxOpen(false)
                }}
                aria-label="Chiudi galleria"
              >
                <LightboxCloseIcon className="size-5" />
              </button>
              {displayItems.filter((i) => i.type === 'image').length > 1 ? (
                <>
                  <button
                    type="button"
                    className={cn(
                      lightboxControlClass,
                      'absolute left-3 top-1/2 -translate-y-1/2 sm:left-5',
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      goPrev()
                    }}
                    aria-label="Immagine precedente"
                  >
                    <LightboxChevronIcon direction="left" className="size-6" />
                  </button>
                  <button
                    type="button"
                    className={cn(
                      lightboxControlClass,
                      'absolute right-3 top-1/2 -translate-y-1/2 sm:right-5',
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      goNext()
                    }}
                    aria-label="Immagine successiva"
                  >
                    <LightboxChevronIcon direction="right" className="size-6" />
                  </button>
                </>
              ) : null}
              <img
                src={lightboxItem.url}
                alt={lightboxItem.alt?.trim() || alt}
                className="max-h-[calc(100dvh-2rem)] max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
