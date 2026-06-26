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
          ? 'border-t border-white/10 bg-idl-ink text-idl-design-fg'
          : 'border-t border-idl-tech-border bg-[#f4f6f8]',
      )}
    >
      <SectionContainer className="py-10 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <Eyebrow
              variant={isDesign ? 'design' : 'technical'}
              className={cn('mb-3', isDesign ? 'text-idl-glow' : 'text-idl-amber')}
            >
              {COPY.eyebrow}
            </Eyebrow>
            <h2
              className={cn(
                'text-[22px] font-medium sm:text-[26px]',
                isDesign ? 'font-serif' : 'font-extrabold tracking-tight text-idl-ink',
              )}
            >
              {COPY.title}
            </h2>
            <p
              className={cn(
                'mt-2 text-[14px] leading-relaxed sm:text-[14.5px]',
                isDesign ? 'text-idl-design-muted' : 'text-idl-muted',
              )}
            >
              {COPY.description}
            </p>
            <ul
              className={cn(
                'mt-4 flex flex-wrap gap-2 text-[12.5px]',
                isDesign ? 'text-idl-design-dim' : 'text-idl-muted',
              )}
            >
              {COPY.bullets.map((item) => (
                <li
                  key={item}
                  className={cn(
                    'rounded-full px-3 py-1',
                    isDesign ? 'border border-white/15' : 'border border-idl-tech-chip-border bg-white',
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
              'inline-flex shrink-0 items-center justify-center rounded-lg px-5 py-3.5 text-center text-[14px] font-bold sm:text-[14.5px]',
              isDesign ? 'bg-idl-glow text-idl-design hover:bg-[#f7bd6f]' : 'bg-idl-amber text-white hover:bg-[#c2730f]',
            )}
          >
            {COPY.ctaLabel}
          </Link>
        </div>
      </SectionContainer>
    </section>
  )
}
