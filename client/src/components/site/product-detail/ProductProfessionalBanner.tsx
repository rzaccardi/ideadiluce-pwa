'use client'

import { useSnapshot } from 'valtio/react'
import { Link } from '@/lib/navigation'
import { SectionContainer, Eyebrow } from '@/components/site/primitives'
import { authStore } from '@/features/auth'
import { useLocalePath } from '@/hooks/use-locale-path'
import { cn } from '@/utils/cn'

type Props = {
  variant?: 'design' | 'technical'
}

const COPY = {
  eyebrow: 'PROFESSIONISTI',
  title: 'Area riservata per installatori e rivenditori',
  description:
    'Listini dedicati, riordino rapido con EAN/SKU e assistenza tecnica prioritaria.',
  ctaLabel: "Accedi all'area professionisti →",
  bullets: ['Listino B2B dedicato', 'Riordino rapido EAN/SKU', 'Assistenza tecnica prioritaria'],
} as const

export function ProductProfessionalBanner({ variant = 'design' }: Props) {
  const lp = useLocalePath()
  const auth = useSnapshot(authStore)
  if (auth.me?.isProfessional || auth.me?.customerSegment === 'professional') {
    return null
  }

  const isDesign = variant === 'design'

  return (
    <section
      className={cn(
        isDesign
          ? 'border-y border-idl-promo-border border-t-2 border-t-idl-brass/45 bg-idl-promo-bg text-idl-ink'
          : 'border-y border-idl-tech-border border-t-2 border-t-idl-amber/40 bg-idl-tech-chip text-idl-ink',
      )}
    >
      <SectionContainer className="py-11 sm:py-14">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="min-w-0 max-w-2xl">
            <Eyebrow
              variant={isDesign ? 'design' : 'technical'}
              className={cn(
                'mb-3 tracking-[0.2em]',
                isDesign ? 'text-idl-brass' : 'text-idl-amber',
              )}
            >
              {COPY.eyebrow}
            </Eyebrow>
            <h2
              className={cn(
                'text-[24px] font-medium leading-tight sm:text-[28px]',
                isDesign ? 'font-serif text-idl-ink' : 'font-extrabold tracking-tight text-idl-graphite',
              )}
            >
              {COPY.title}
            </h2>
            <p
              className={cn(
                'mt-2.5 text-[14px] leading-relaxed sm:text-[14.5px]',
                isDesign ? 'text-idl-ink-soft' : 'text-idl-graphite-2',
              )}
            >
              {COPY.description}
            </p>
            <ul
              className={cn(
                'mt-4 flex flex-wrap gap-2 text-[12.5px] font-medium',
                isDesign ? 'text-idl-ink-soft' : 'text-idl-graphite-2',
              )}
            >
              {COPY.bullets.map((item) => (
                <li
                  key={item}
                  className={cn(
                    'rounded-full px-3 py-1',
                    isDesign
                      ? 'border border-idl-border-strong bg-idl-paper'
                      : 'border border-idl-tech-chip-border bg-idl-tech-panel',
                  )}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Link
            to={lp('/professionisti')}
            className={cn(
              'inline-flex w-full shrink-0 items-center justify-center rounded-lg px-5 py-3.5 text-center text-[14px] font-bold transition sm:w-auto sm:text-[14.5px]',
              isDesign
                ? 'bg-idl-glow text-idl-design hover:bg-idl-cta-glow-hover'
                : 'bg-idl-amber text-white hover:bg-idl-cta-amber-hover dark:text-idl-design',
            )}
          >
            {COPY.ctaLabel}
          </Link>
        </div>
      </SectionContainer>
    </section>
  )
}
