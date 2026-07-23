import { Link } from '@/lib/navigation'
import type { CategoryCtaBanner } from '@/types/category-landing'
import { SectionContainer } from '../primitives'
import { cn } from '@/utils/cn'
import type { LocalePathFn } from '../sections/types'

type Props = {
  banner: CategoryCtaBanner
  lp: LocalePathFn
  variant?: 'design' | 'technical'
}

export function CategoryCtaBanner({ banner, lp, variant = 'design' }: Props) {
  const isDesign = variant === 'design'

  return (
    <section className={cn(isDesign ? 'bg-idl-ink text-idl-design-fg' : 'border-t border-idl-amber/20 bg-idl-paper')}>
      <SectionContainer
        className={cn(
          'flex flex-col items-stretch justify-between gap-6 py-8 sm:flex-row sm:items-center sm:gap-8',
          isDesign ? 'sm:py-12' : 'sm:py-10',
        )}
      >
        <div className="min-w-0 max-w-xl">
          <h2
            className={cn(
              'font-medium',
              isDesign ? 'font-serif text-[22px] sm:text-[26px]' : 'text-[20px] font-extrabold tracking-tight text-idl-ink sm:text-[22px]',
            )}
          >
            {banner.title}
          </h2>
          <p className={cn('mt-2 text-[14px] leading-relaxed sm:text-[14.5px]', isDesign ? 'text-idl-design-muted' : 'text-idl-ink-muted')}>
            {banner.description}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
          <Link
            to={lp(banner.primaryCta.href)}
            className={cn(
              'rounded px-5 py-3.5 text-center text-[14px] font-bold sm:text-[14.5px] sm:whitespace-nowrap',
              isDesign ? 'bg-idl-glow text-idl-design' : 'bg-idl-amber text-white dark:text-idl-design',
            )}
          >
            {banner.primaryCta.label}
          </Link>
          {banner.secondaryCta ? (
            <Link
              to={lp(banner.secondaryCta.href)}
              className={cn(
                'rounded border px-5 py-3 text-center text-[14px] font-semibold sm:text-[14.5px] sm:whitespace-nowrap',
                isDesign
                  ? 'border-idl-design-dim text-idl-design-fg'
                  : 'border-idl-path-design-border bg-idl-tech-panel font-bold text-idl-ink',
              )}
            >
              {banner.secondaryCta.label}
            </Link>
          ) : null}
        </div>
      </SectionContainer>
    </section>
  )
}
