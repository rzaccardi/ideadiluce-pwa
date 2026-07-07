'use client'

import { useState } from 'react'
import { Link } from '@/lib/navigation'
import { SiteImage } from '../../SiteImage'
import { Eyebrow, SectionContainer } from '../../primitives'
import { SiteHeading } from '../../SiteHeading'
import { AMBIENTI_SHOP_THE_LOOK } from '@/lib/ambienti.defaults'
import type { LocalePathFn } from '../../sections/types'
import { cn } from '@/utils/cn'

type Props = {
  lp: LocalePathFn
}

export function ShopTheLookSection({ lp }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null)
  const look = AMBIENTI_SHOP_THE_LOOK
  const activeHotspot = look.hotspots.find((hotspot) => hotspot.id === activeId)

  return (
    <section id="shop-the-look" className="border-t border-white/6 bg-idl-design text-idl-design-fg">
      <SectionContainer className="py-12 sm:py-16">
        <div className="mb-8 text-center sm:mb-9">
          <Eyebrow className="mb-3.5">SHOP THE LOOK</Eyebrow>
          <h2 className="font-serif text-[26px] font-medium sm:text-[32px]">{look.title}</h2>
          <p className="mx-auto mt-2.5 max-w-[620px] text-[15px] text-idl-design-muted">{look.subtitle}</p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-9">
          <div className="relative overflow-hidden rounded-lg shadow-[0_0_90px_rgba(201, 162, 75,0.10)]">
            <div className="relative aspect-[4/3] bg-idl-design-elevated">
              <SiteImage src={look.imageUrl} alt={look.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
              {look.hotspots.map((hotspot) => {
                const isActive = activeId === hotspot.id
                return (
                  <button
                    key={hotspot.id}
                    type="button"
                    aria-label={`Punto luce ${hotspot.id}: ${hotspot.title}`}
                    onClick={() => setActiveId(isActive ? null : hotspot.id)}
                    className={cn(
                      'ambienti-hotspot absolute flex size-[30px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[14px] font-extrabold text-idl-design transition',
                      isActive ? 'bg-idl-tech-panel' : 'bg-idl-glow',
                    )}
                    style={{
                      left: hotspot.left,
                      top: hotspot.top,
                      animationDelay: hotspot.delay,
                    }}
                  >
                    {hotspot.id}
                  </button>
                )
              })}
            </div>

            {activeHotspot ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(22,19,13,0.96)] via-[rgba(22,19,13,0.72)] to-transparent px-5 pb-5 pt-16 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className={cn(
                        'mb-2 inline-block rounded px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] text-idl-design',
                        activeHotspot.badge === 'NECESSARIO' ? 'bg-[#e0a85a]' : 'bg-idl-glow',
                      )}
                    >
                      {activeHotspot.badge}
                    </span>
                    <SiteHeading
                      level={3}
                      className="font-serif text-[18px] text-idl-design-fg sm:text-[20px]"
                    >
                      {activeHotspot.title}
                    </SiteHeading>
                    <div className="mt-1 text-[13px] text-idl-design-muted">{activeHotspot.subtitle}</div>
                    <div className="mt-1.5 font-mono text-[11.5px] text-idl-glow">{activeHotspot.spec}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[18px] font-extrabold text-idl-design-fg">{activeHotspot.price}</div>
                    <Link
                      to={lp(activeHotspot.href)}
                      className="mt-2 inline-block rounded-md bg-idl-glow px-3.5 py-2 text-[12.5px] font-bold text-idl-design"
                    >
                      Vedi prodotto
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-white/7 bg-[#0c0c0d] p-5 sm:p-6">
            <h3 className="font-serif text-[19px] text-idl-design-fg sm:text-[21px]">Prodotti in questo look</h3>
            <p className="mt-1 text-[13px] text-idl-design-dim">Visibili nella foto + componenti necessari.</p>

            <div className="mt-5 flex flex-col gap-3.5">
              {look.products.map((product) => (
                <Link
                  key={product.id}
                  to={lp(product.href)}
                  className="flex items-center gap-3 transition hover:opacity-90"
                >
                  <span
                    className={cn(
                      'flex size-[26px] shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-idl-design',
                      product.visible ? 'bg-idl-glow' : 'bg-idl-design-dim',
                    )}
                  >
                    {product.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <SiteHeading level={4} className="text-[14px] font-bold text-idl-design-fg">
                      {product.title}
                    </SiteHeading>
                    <div className={cn('text-[11.5px]', product.visible ? 'text-idl-design-dim' : 'text-idl-amber')}>
                      {product.subtitle}
                    </div>
                  </div>
                  <span className="shrink-0 text-[14px] font-bold text-idl-design-fg">{product.price}</span>
                </Link>
              ))}
            </div>

            <div className="mt-5 border-t border-white/8 pt-4">
              <div className="mb-3.5 flex items-baseline justify-between">
                <span className="text-[14px] text-idl-design-muted">Totale look</span>
                <span className="font-serif text-[24px] text-idl-design-fg sm:text-[26px]">{look.total}</span>
              </div>
              <Link
                to={lp('/negozio?world=design&category=cucina')}
                className="mb-2.5 block rounded-lg bg-idl-glow py-3.5 text-center text-[15px] font-bold text-idl-design transition hover:bg-[#f7bd6f]"
              >
                Aggiungi tutto il look
              </Link>
              <div className="flex gap-2">
                <Link
                  to={lp('/prodotto-non-trovato')}
                  className="flex-1 rounded-lg border border-white/18 py-2.5 text-center text-[13px] font-semibold text-idl-design-fg"
                >
                  Personalizza
                </Link>
                <Link
                  to={lp('/negozio?world=design&category=cucina')}
                  className="flex-1 rounded-lg border border-white/18 py-2.5 text-center text-[13px] font-semibold text-idl-design-fg"
                >
                  Alternative
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start gap-3 rounded-[10px] border border-idl-glow/20 bg-[#1a1a1b] p-4 sm:flex-row sm:items-center sm:gap-3.5 sm:p-5">
          <span className="shrink-0 rounded bg-idl-glow px-2.5 py-1 font-mono text-[10.5px] tracking-[0.1em] text-idl-design">
            CONSIGLIO
          </span>
          <p className="text-[13.5px] leading-relaxed text-idl-design-muted">
            Usa <strong className="text-idl-design-fg">4000K</strong> sul piano lavoro per vedere bene i colori dei cibi e{' '}
            <strong className="text-idl-design-fg">3000K</strong> su tavolo e isola per un&apos;atmosfera più accogliente.
          </p>
        </div>
      </SectionContainer>
    </section>
  )
}
