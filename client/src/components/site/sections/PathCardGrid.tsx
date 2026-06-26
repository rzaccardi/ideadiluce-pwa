import { Link } from '@/lib/navigation'
import type { HomePathCard } from '@/types/site-content'
import { HoverLift, Stagger, StaggerItem } from '@/components/motion'
import { cn } from '@/utils/cn'
import type { LocalePathFn } from './types'

type Props = {
  cards: ReadonlyArray<HomePathCard>
  lp: LocalePathFn
  stagger?: number
}

export function PathCardGrid({ cards, lp, stagger = 0.06 }: Props) {
  return (
    <Stagger className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" stagger={stagger}>
      {cards.map((card) => (
        <StaggerItem key={card.title}>
          <HoverLift>
            <Link
              to={lp(card.href)}
              className={cn(
                'block rounded-lg border p-5 transition',
                card.variant === 'design' && 'border-idl-path-design-border bg-idl-path-design hover:border-idl-brass',
                card.variant === 'technical' && 'border-idl-path-tech-border bg-idl-path-tech hover:border-idl-amber',
                card.variant === 'dark' && 'border-transparent bg-idl-design text-idl-design-fg',
              )}
            >
              <div className="text-base font-bold">{card.title}</div>
              <p
                className={cn(
                  'mt-1.5 text-[13px] leading-snug',
                  card.variant === 'dark'
                    ? 'text-idl-design-muted'
                    : card.variant === 'design'
                      ? 'text-idl-ink-muted'
                      : 'text-idl-muted',
                )}
              >
                {card.description}
              </p>
              <div
                className={cn(
                  'mt-4 text-[13.5px] font-bold',
                  card.variant === 'technical' && 'text-idl-amber',
                  card.variant === 'design' && 'text-idl-brass',
                  card.variant === 'dark' && 'text-idl-glow',
                )}
              >
                {card.ctaLabel}
              </div>
            </Link>
          </HoverLift>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
