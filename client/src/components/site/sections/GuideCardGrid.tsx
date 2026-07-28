import { Link } from '@/lib/navigation'
import { HoverLift, Stagger, StaggerItem } from '@/components/motion'
import { SiteHeading } from '@/components/site/SiteHeading'
import { SiteImage } from '@/components/site/SiteImage'
import { cn } from '@/utils/cn'
import type { LocalePathFn } from './types'

export type GuideCardItem = {
  category?: string
  title: string
  meta?: string
  href: string
  imageUrl?: string
}

type Props = {
  items: ReadonlyArray<GuideCardItem>
  lp: LocalePathFn
  variant?: 'home' | 'editorial'
  stagger?: number
}

export function GuideCardGrid({ items, lp, variant = 'home', stagger = 0.07 }: Props) {
  const isHome = variant === 'home'
  const displayItems = isHome ? items.slice(0, 4) : items

  return (
    <Stagger
      className={
        isHome
          ? cn(
              '-mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-1',
              'snap-x snap-mandatory',
              '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
              'sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none',
              'lg:grid-cols-4 lg:grid-rows-1',
            )
          : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-2'
      }
      stagger={stagger}
      immediate={variant === 'editorial'}
    >
      {displayItems.map((guide) => (
        <StaggerItem
          key={guide.href}
          className={isHome ? 'w-[min(78vw,18rem)] shrink-0 snap-start sm:w-auto sm:shrink' : undefined}
        >
          <HoverLift>
            <Link
              to={lp(guide.href)}
              className={cn(
                'group flex h-full flex-col overflow-hidden rounded-lg border border-idl-path-design-border bg-white transition hover:border-idl-brass dark:bg-idl-tech-panel',
                !guide.imageUrl && (isHome ? 'min-h-[210px]' : 'min-h-[180px]'),
              )}
            >
              {guide.imageUrl ? (
                <div className="relative aspect-[16/10] overflow-hidden bg-idl-cream">
                  <SiteImage
                    src={guide.imageUrl}
                    alt=""
                    fill
                    sizes={
                      isHome
                        ? '(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 25vw'
                        : '(max-width: 640px) 100vw, 50vw'
                    }
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-5">
                {guide.category ? (
                  <div className="font-mono text-[10.5px] tracking-widest text-idl-brass-light uppercase">
                    {guide.category}
                  </div>
                ) : null}
                <SiteHeading
                  level={3}
                  className={cn(
                    'font-serif text-xl leading-snug font-medium text-idl-ink',
                    guide.category ? 'mt-3' : undefined,
                  )}
                >
                  {guide.title}
                </SiteHeading>
                <div className="flex-1" />
                {guide.meta ? (
                  <div className="mt-4 text-[13px] font-bold text-idl-brass">
                    {variant === 'editorial' ? `${guide.meta} · Leggi →` : guide.meta}
                  </div>
                ) : null}
              </div>
            </Link>
          </HoverLift>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
