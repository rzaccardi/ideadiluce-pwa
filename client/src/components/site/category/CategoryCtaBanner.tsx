'use client'

import { Link } from '@/lib/navigation'
import type { CategoryCtaBanner } from '@/types/category-landing'
import { Reveal } from '@/components/motion'
import { SectionContainer, Eyebrow } from '../primitives'
import { cn } from '@/utils/cn'
import type { LocalePathFn } from '../sections/types'

type Props = {
  banner: CategoryCtaBanner
  lp: LocalePathFn
  variant?: 'design' | 'technical'
}

export function CategoryCtaBanner({ banner, lp, variant = 'design' }: Props) {
  const isDesign = variant === 'design'
  const eyebrow = banner.eyebrow?.trim()
  const title = banner.title?.trim()
  const description = banner.description?.trim()
  const hasCopy = Boolean(eyebrow || title || description)

  return (
    <Reveal
      className={cn(
        isDesign
          ? 'bg-idl-design text-idl-design-fg dark:border-y dark:border-idl-glow/25'
          : 'border-t border-idl-amber/20 bg-idl-paper',
      )}
    >
      <SectionContainer
        className={cn(
          'flex flex-col items-stretch justify-between gap-7 sm:flex-row sm:items-center sm:gap-10',
          isDesign ? 'py-12 sm:py-16' : 'py-8 sm:py-10',
          !hasCopy && 'sm:justify-center',
        )}
      >
        {hasCopy ? (
          <div className="min-w-0 max-w-xl">
            {eyebrow ? (
              <Eyebrow
                variant={isDesign ? 'design' : 'technical'}
                className={cn('mb-3 tracking-[0.2em]', isDesign ? 'text-idl-glow' : 'text-idl-amber')}
              >
                {eyebrow}
              </Eyebrow>
            ) : null}
            {title ? (
              <h2
                className={cn(
                  'font-medium',
                  isDesign
                    ? 'font-serif text-[24px] leading-tight text-idl-design-fg sm:text-[28px]'
                    : 'text-[20px] font-extrabold tracking-tight text-idl-ink sm:text-[22px]',
                )}
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                className={cn(
                  'text-[14px] leading-relaxed sm:text-[14.5px]',
                  title && 'mt-2.5',
                  !title && eyebrow && 'mt-2',
                  isDesign ? 'text-idl-design-muted' : 'text-idl-ink-muted',
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
          <Link
            to={lp(banner.primaryCta.href)}
            className={cn(
              'rounded-lg px-5 py-3.5 text-center text-[14px] font-bold transition sm:text-[14.5px] sm:whitespace-nowrap',
              isDesign
                ? 'bg-idl-glow text-idl-design hover:bg-idl-cta-glow-hover'
                : 'bg-idl-amber text-white hover:bg-idl-cta-amber-hover dark:text-idl-design',
            )}
          >
            {banner.primaryCta.label}
          </Link>
          {banner.secondaryCta ? (
            <Link
              to={lp(banner.secondaryCta.href)}
              className={cn(
                'rounded-lg border px-5 py-3 text-center text-[14px] font-semibold transition sm:text-[14.5px] sm:whitespace-nowrap',
                isDesign
                  ? 'border-idl-design-dim text-idl-design-fg hover:border-idl-glow hover:text-idl-glow'
                  : 'border-idl-path-design-border bg-idl-tech-panel font-bold text-idl-ink',
              )}
            >
              {banner.secondaryCta.label}
            </Link>
          ) : null}
        </div>
      </SectionContainer>
    </Reveal>
  )
}
