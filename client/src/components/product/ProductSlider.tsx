'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ProductCardDTO } from '@/types/dto'
import { ProductCard } from '@/components/product/ProductCard'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  products: ReadonlyArray<ProductCardDTO>
  title?: string
  emptyMessage?: string
  className?: string
  /** fullBleed: edge-to-edge nel layout pagina; contained: scroll orizzontale nel genitore */
  variant?: 'fullBleed' | 'contained'
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none">
      <path
        d={direction === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function ProductSlider({
  products,
  title,
  emptyMessage,
  className,
  variant = 'fullBleed',
}: Props) {
  const { t } = useI18n()
  const message = emptyMessage ?? t('product.grid.empty')
  const scrollRef = useRef<HTMLUListElement>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollPrev(scrollLeft > 4)
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
  }, [products.length, updateScrollState])

  const scrollBy = (direction: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    const firstCard = el.querySelector<HTMLElement>('li')
    const gap = 24
    const step = firstCard ? firstCard.offsetWidth + gap : el.clientWidth * 0.85
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  if (products.length === 0) {
    return <p className="py-12 text-center text-sm text-idl-muted">{message}</p>
  }

  const showNav = products.length > 1
  const isContained = variant === 'contained'

  return (
    <section className={cn(isContained ? 'min-w-0 overflow-hidden' : 'overflow-visible', className)}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-idl-graphite">{title}</h2>
          {showNav ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label={t('product.slider.prev')}
                disabled={!canScrollPrev}
                onClick={() => scrollBy(-1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-idl-border bg-white text-idl-ink-soft transition hover:border-idl-border-strong hover:bg-idl-cream disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronIcon direction="left" />
              </button>
              <button
                type="button"
                aria-label={t('product.slider.next')}
                disabled={!canScrollNext}
                onClick={() => scrollBy(1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-idl-border bg-white text-idl-ink-soft transition hover:border-idl-border-strong hover:bg-idl-cream disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronIcon direction="right" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <ul
        ref={scrollRef}
        className={cn(
          'flex gap-4 sm:gap-6',
          'overflow-x-auto overflow-y-visible scroll-smooth pb-2 snap-x snap-mandatory',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
          isContained
            ? 'w-full min-w-0'
            : 'ml-[calc(50%-50vw)] w-screen max-w-none pl-[max(1rem,calc((100vw-72rem)/2+1rem))] pr-[max(1rem,calc((100vw-72rem)/2+1rem))]',
        )}
      >
        {products.map((p) => (
          <li
            key={p.slug}
            className={cn(
              'flex shrink-0 snap-start',
              isContained ? 'w-[14rem] sm:w-[17.5rem]' : 'w-[min(85vw,17.5rem)]',
            )}
          >
            <ProductCard product={p} className="h-full w-full" />
          </li>
        ))}
      </ul>
    </section>
  )
}
