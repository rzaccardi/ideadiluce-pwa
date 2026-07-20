'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@/lib/navigation'
import { HoverLift } from '@/components/motion'
import { SiteHeading } from '@/components/site/SiteHeading'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import type { GuideCardItem } from './GuideCardGrid'
import type { LocalePathFn } from './types'

type Props = {
  items: ReadonlyArray<GuideCardItem>
  lp: LocalePathFn
  className?: string
  loop?: boolean
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

export function GuideCardSlider({ items, lp, className, loop = false }: Props) {
  const { t } = useI18n()
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
  }, [items.length, updateScrollState])

  const scrollBy = (direction: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    const firstCard = el.querySelector<HTMLElement>('li')
    const gap = 16
    const step = firstCard ? firstCard.offsetWidth + gap : el.clientWidth * 0.85
    const { scrollLeft, scrollWidth, clientWidth } = el

    if (loop) {
      const atStart = scrollLeft <= 4
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 4
      if (direction === 1 && atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }
      if (direction === -1 && atStart) {
        el.scrollTo({ left: scrollWidth - clientWidth, behavior: 'smooth' })
        return
      }
    }

    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  if (items.length === 0) return null

  const showNav = items.length > 1

  return (
    <div className={cn('min-w-0', className)}>
      {showNav ? (
        <div className="mb-4 flex justify-end gap-2">
          <button
            type="button"
            aria-label={t('product.slider.prev')}
            disabled={!loop && !canScrollPrev}
            onClick={() => scrollBy(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-idl-border bg-white text-idl-ink-soft transition hover:border-idl-border-strong hover:bg-idl-cream disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            aria-label={t('product.slider.next')}
            disabled={!loop && !canScrollNext}
            onClick={() => scrollBy(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-idl-border bg-white text-idl-ink-soft transition hover:border-idl-border-strong hover:bg-idl-cream disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      ) : null}

      <ul
        ref={scrollRef}
        className={cn(
          '-mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-1 sm:mx-0 sm:px-0',
          'snap-x snap-mandatory',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {items.map((guide) => (
          <li key={guide.href} className="w-[min(78vw,18rem)] shrink-0 snap-start sm:w-[17.5rem]">
            <HoverLift>
              <Link
                to={lp(guide.href)}
                className="flex min-h-[180px] flex-col rounded-lg border border-idl-path-design-border bg-white p-5 transition hover:border-idl-brass dark:bg-idl-tech-panel"
              >
                {guide.category ? (
                  <div className="font-mono text-[10.5px] tracking-widest text-idl-brass-light uppercase">
                    {guide.category}
                  </div>
                ) : null}
                <SiteHeading
                  level={3}
                  className="mt-3 font-serif text-xl leading-snug font-medium text-idl-ink"
                >
                  {guide.title}
                </SiteHeading>
                <div className="flex-1" />
                {guide.meta ? (
                  <div className="mt-4 text-[13px] font-bold text-idl-brass">
                    {`${guide.meta} · Leggi →`}
                  </div>
                ) : null}
              </Link>
            </HoverLift>
          </li>
        ))}
      </ul>
    </div>
  )
}
