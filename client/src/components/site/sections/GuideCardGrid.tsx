import { Link } from '@/lib/navigation'
import { HoverLift, Stagger, StaggerItem } from '@/components/motion'
import { SiteHeading } from '@/components/site/SiteHeading'
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
  const gridClass =
    variant === 'home'
      ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-2'
  const minHeight = variant === 'home' ? 'min-h-[210px]' : 'min-h-[180px]'

  return (
    <Stagger className={gridClass} stagger={stagger} immediate={variant === 'editorial'}>
      {items.map((guide) => (
        <StaggerItem key={guide.href}>
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
