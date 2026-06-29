'use client'

import { useMemo, useState } from 'react'
import { Link } from '@/lib/navigation'
import { RoomCardMedia } from '../../sections/RoomCardMedia'
import { SectionContainer } from '../../primitives'
import {
  AMBIENTI_ROOM_GROUPS,
  getAmbientiRoomMeta,
  roomSlugFromHref,
  type AmbientiRoomGroup,
} from '@/lib/ambienti.defaults'
import type { EditorialTile } from '@/types/site-content'
import type { LocalePathFn } from '../../sections/types'
import { cn } from '@/utils/cn'

type Props = {
  items: ReadonlyArray<EditorialTile>
  lp: LocalePathFn
}

export function AmbientiRoomsSection({ items, lp }: Props) {
  const [activeGroup, setActiveGroup] = useState<AmbientiRoomGroup>('casa')

  const rooms = useMemo(() => {
    return items
      .map((item) => {
        const slug = roomSlugFromHref(item.href)
        const meta = getAmbientiRoomMeta(slug)
        return { item, slug, meta }
      })
      .filter(({ meta }) => meta?.group === activeGroup)
  }, [activeGroup, items])

  return (
    <section id="ambienti" className="bg-white">
      <SectionContainer className="py-10 sm:py-14">
        <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-[26px] font-medium text-idl-ink sm:text-[30px]">Scegli l&apos;ambiente</h2>
          <div className="flex flex-wrap gap-2">
            {AMBIENTI_ROOM_GROUPS.map((group) => {
              const active = activeGroup === group.id
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroup(group.id)}
                  className={cn(
                    'rounded-[30px] px-4 py-2 text-[13px] font-semibold transition',
                    active
                      ? 'bg-idl-ink font-bold text-white'
                      : 'border border-idl-path-design-border bg-idl-cream text-idl-graphite-2',
                  )}
                >
                  {group.label}
                </button>
              )
            })}
          </div>
        </div>
        <p className="mb-6 text-[14.5px] text-idl-ink-muted">
          Ogni ambiente parte dalla funzione della luce: generale, da lavoro, d&apos;atmosfera.
        </p>

        {activeGroup === 'professionale' ? (
          <div className="rounded-xl border border-idl-path-design-border bg-idl-path-design p-8 text-center">
            <p className="text-[15px] text-idl-ink-muted">
              Soluzioni per uffici, negozi, hotel e spazi commerciali.
            </p>
            <Link
              to={lp('/professionisti')}
              className="mt-4 inline-block text-[14px] font-bold text-idl-brass"
            >
              Scopri l&apos;area professionisti →
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map(({ item, meta }) => {
              if (!meta) return null
              return (
                <article
                  key={item.href}
                  className="group overflow-hidden rounded-xl border border-idl-path-design-border bg-white transition hover:border-idl-brass hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <Link to={lp(item.href)} className="block">
                    {item.imageUrl ? (
                      <RoomCardMedia
                        imageUrl={item.imageUrl}
                        videoUrl={item.videoUrl}
                        alt={item.title}
                        hoverScaleClass="group-hover:scale-[1.02]"
                        sizes="(max-width: 1024px) 50vw, 33vw"
                      />
                    ) : null}
                  </Link>
                  <div className="p-5 sm:p-6">
                    <Link to={lp(item.href)}>
                      <h3 className="font-serif text-[20px] font-medium text-idl-ink sm:text-[22px]">{item.title}</h3>
                    </Link>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-idl-graphite-2">{meta.description}</p>
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {meta.tags.map((tag) => (
                        <Link
                          key={tag.label}
                          to={lp(tag.href)}
                          className="rounded-[20px] border border-idl-path-design-border bg-idl-cream px-2.5 py-1 text-[11.5px] text-idl-graphite-2 transition hover:border-idl-brass hover:text-idl-brass"
                        >
                          {tag.label}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={cn(
                          'font-mono text-[11.5px]',
                          meta.kelvinWarning ? 'text-idl-amber' : 'text-idl-brass',
                        )}
                      >
                        {meta.kelvinTip}
                      </span>
                      <Link to={lp(item.href)} className="text-[13.5px] font-bold text-idl-brass">
                        Scopri →
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </SectionContainer>
    </section>
  )
}
