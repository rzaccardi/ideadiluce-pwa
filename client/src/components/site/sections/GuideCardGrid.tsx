import { Link } from '@/lib/navigation'
import { HoverLift, Stagger, StaggerItem } from '@/components/motion'
import { SiteHeading } from '@/components/site/SiteHeading'
import { cn } from '@/utils/cn'
import type { LocalePathFn } from './types'

export type GuideCardItem = {
  category?: string
  title: string
  meta?: string
  href: string
}

type Props = {
  items: ReadonlyArray<GuideCardItem>
  lp: LocalePathFn
  variant?: 'home' | 'editorial'
  stagger?: number
}

export function GuideCardGrid({ items, lp, variant = 'home', stagger = 0.07 }: Props) {
  const isHome = variant === 'home'
  const minHeight = isHome ? 'min-h-[210px]' : 'min-h-[180px]'

  return (
    <Stagger
      className={
        isHome
          ? cn(
              '-mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-1',
              'snap-x snap-mandatory',
              '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
              'sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none',
              'lg:grid-cols-4',
            )
          : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-2'
      }
      stagger={stagger}
      immediate={variant === 'editorial'}
    >
      {items.map((guide) => (
        <StaggerItem
          key={guide.href}
          className={isHome ? 'w-[min(78vw,18rem)] shrink-0 snap-start sm:w-auto sm:shrink' : undefined}
        >
          <HoverLift>
            <Link
              to={lp(guide.href)}
              className={`flex ${minHeight} flex-col rounded-lg border border-idl-path-design-border bg-white p-5 transition hover:border-idl-brass dark:bg-idl-tech-panel`}
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
                  {variant === 'editorial' ? `${guide.meta} · Leggi →` : guide.meta}
                </div>
              ) : null}
            </Link>
          </HoverLift>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
