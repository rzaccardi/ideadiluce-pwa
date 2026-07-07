import { Link } from '@/lib/navigation'
import { HoverLift, Stagger, StaggerItem } from '@/components/motion'
import { SiteHeading } from '@/components/site/SiteHeading'
import { RoomCardMedia } from './RoomCardMedia'
import type { LocalePathFn } from './types'

export type RoomCardItem = {
  title: string
  imageUrl?: string
  videoUrl?: string
  href: string
  description?: string
}

type Props = {
  items: ReadonlyArray<RoomCardItem>
  lp: LocalePathFn
  variant?: 'home' | 'editorial'
  stagger?: number
}

export function RoomCardGrid({ items, lp, variant = 'home', stagger = 0.08 }: Props) {
  if (variant === 'editorial') {
    return (
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
        {items.map((room) => (
          <StaggerItem key={room.href}>
            <HoverLift>
              <Link
                to={lp(room.href)}
                className="group block overflow-hidden rounded-lg border border-idl-border bg-white"
              >
                {room.imageUrl ? (
                  <RoomCardMedia
                    imageUrl={room.imageUrl}
                    videoUrl={room.videoUrl}
                    alt={room.title}
                    aspectClass="aspect-[4/3]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : null}
                <div className="p-5">
                  <h3 className="font-serif text-xl text-idl-ink">{room.title}</h3>
                  {room.description ? (
                    <p className="mt-1 text-sm text-idl-muted">{room.description}</p>
                  ) : null}
                </div>
              </Link>
            </HoverLift>
          </StaggerItem>
        ))}
      </Stagger>
    )
  }

  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={stagger}>
      {items.map((room) => (
        <StaggerItem key={room.title}>
          <HoverLift>
            <Link to={lp(room.href)} className="group block">
              {room.imageUrl ? (
                <RoomCardMedia
                  imageUrl={room.imageUrl}
                  videoUrl={room.videoUrl}
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              ) : null}
              <div className="mt-3 flex items-center justify-between">
                <SiteHeading level={3} className="font-serif text-[19px] font-medium text-idl-ink">
                  {room.title}
                </SiteHeading>
                <span className="text-[13px] font-bold text-idl-brass">Scopri →</span>
              </div>
            </Link>
          </HoverLift>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
