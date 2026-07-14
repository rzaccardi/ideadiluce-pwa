'use client'

import { Link } from '@/lib/navigation'
import { SectionContainer } from '@/components/site/primitives'
import { SiteSectionHeader } from '@/components/site/sections/SiteSectionHeader'
import { RoomCardMedia } from '@/components/site/sections/RoomCardMedia'
import type { HomeRoomCard } from '@/types/site-content'
import type { Home2PageContent } from '@/lib/homepage2.defaults'
import type { LocalePathFn } from '@/components/site/sections/types'

type Props = {
  section: Home2PageContent['inspiration']
  rooms: ReadonlyArray<HomeRoomCard>
  lp: LocalePathFn
}

export function Home2InspirationGrid({ section, rooms, lp }: Props) {
  const items = rooms.filter((room) => room.imageUrl?.trim()).slice(0, 8)

  return (
    <section className="border-t border-idl-border bg-white py-12 sm:py-16 dark:bg-idl-tech-panel">
      <SectionContainer>
        <SiteSectionHeader
          eyebrow={section.eyebrow}
          title={section.title}
          subtitle={section.subtitle}
          linkHref={section.linkHref}
          linkLabel={section.linkLabel}
          linkTone="brass"
          titleStyle="serif-md"
          layout="split"
          lp={lp}
        />
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3">
          {items.map((room) => (
            <Link
              key={room.href}
              to={lp(room.href)}
              className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-idl-cream"
            >
              <RoomCardMedia
                imageUrl={room.imageUrl}
                videoUrl={room.videoUrl}
                alt={room.title}
                aspectClass="aspect-[4/5]"
                sizes="(max-width:640px) 50vw, 33vw"
                hoverScaleClass="transition duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                <p className="font-serif text-[15px] leading-snug text-white sm:text-[16px]">{room.title}</p>
                <span className="mt-1 inline-flex text-[12px] font-bold text-idl-glow opacity-0 transition group-hover:opacity-100">
                  Scopri →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
