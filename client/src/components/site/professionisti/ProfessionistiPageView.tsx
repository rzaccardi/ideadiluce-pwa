'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import type { ProfessionistiPageContent } from '@/types/site-content'
import { ProfessionalAccountForm } from './ProfessionalAccountForm'
import { SectionContainer } from '../primitives'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { cn } from '@/utils/cn'

type Props = {
  content: ProfessionistiPageContent
}

function scrollToRegistration() {
  document.getElementById('registrazione')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function ProfessionistiPageView({ content }: Props) {
  const lp = useLocalePath()
  const auth = useSnapshot(authStore)
  const [reorderText, setReorderText] = useState(
    content.quickReorder.exampleLines.join('\n'),
  )

  const accountHref = auth.me ? '/account' : content.hero.secondaryCta.href

  function onQuickReorder() {
    if (!auth.me) {
      toast.message(content.quickReorder.loginHint)
      scrollToRegistration()
      return
    }
    toast.message('Il riordino rapido da codice sarà disponibile a breve con account business attivo.')
  }

  return (
    <div className="bg-white">
      <Reveal immediate className="relative overflow-hidden bg-idl-graphite text-[#eef1f4]">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_40%,rgba(217,131,26,0.16),transparent_60%)]"
          aria-hidden
        />
        <SectionContainer className="relative z-[1] grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <div className="font-mono text-[11px] tracking-[0.22em] text-[#f0a23f]">
              {content.eyebrow}
            </div>
            <h1 className="mt-4 text-[clamp(2rem,4vw,2.875rem)] font-extrabold leading-[1.06] tracking-tight">
              {content.title}
            </h1>
            <p className="mt-4 max-w-xl text-[16.5px] leading-relaxed text-[#aab2bd]">
              {content.subtitle}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToRegistration}
                className="rounded-lg bg-idl-amber px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#c2730f]"
              >
                {content.hero.primaryCta.label}
              </button>
              <Link
                to={lp(accountHref)}
                className="rounded-lg border border-[#3a414b] px-6 py-3.5 text-[15px] font-semibold text-[#eef1f4] transition hover:border-[#eef1f4]/40"
              >
                {content.hero.secondaryCta.label}
              </Link>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#2a2f37] bg-[#1b1e24] p-6">
            <div className="font-mono text-[10.5px] tracking-[0.14em] text-[#8b919b]">
              {content.quickReorder.title}
            </div>
            <textarea
              value={reorderText}
              onChange={(e) => setReorderText(e.target.value)}
              rows={5}
              className="mt-3.5 w-full resize-y rounded-lg border border-[#2a2f37] bg-idl-graphite px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-idl-muted outline-none focus:border-idl-amber/50"
              placeholder={content.quickReorder.placeholder}
            />
            <button
              type="button"
              onClick={onQuickReorder}
              className="mt-3 w-full rounded-lg bg-[#eef1f4] py-3 text-center text-sm font-bold text-idl-graphite transition hover:bg-white"
            >
              {content.quickReorder.ctaLabel}
            </button>
            <p className="mt-2.5 text-center text-[11.5px] text-idl-muted">
              {content.quickReorder.footnote}
            </p>
          </div>
        </SectionContainer>
      </Reveal>

      <SectionContainer className="py-12 sm:py-14">
        <Stagger immediate className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.05}>
          {content.features.map((item) => (
            <StaggerItem key={item.num}>
              <div className="h-full rounded-xl border border-idl-tech-border bg-white p-6">
                <div className="font-mono text-[11px] text-idl-amber">{item.num}</div>
                <div className="mt-2 text-base font-bold text-idl-graphite">{item.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-idl-muted">{item.description}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </SectionContainer>

      <Reveal className="border-y border-idl-path-design-border bg-idl-path-design">
        <SectionContainer className="py-12 sm:py-14">
          <h2 className="font-serif text-[28px] font-medium text-idl-ink">
            {content.audiences.title}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.audiences.items.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-idl-path-design-border bg-white p-6"
              >
                <div className="text-[17px] font-bold text-idl-ink">{item.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-[#6b6157]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </SectionContainer>
      </Reveal>

      <div id="registrazione" className="scroll-mt-24">
        <SectionContainer className="grid max-w-[1100px] gap-10 py-12 sm:py-14 lg:grid-cols-2 lg:items-start lg:gap-12">
          <Reveal>
            <h2 className="text-2xl font-extrabold tracking-tight text-idl-graphite">
              {content.registration.title}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-idl-muted sm:text-[15px]">
              {content.registration.description}
            </p>
            <ul className="mt-6 space-y-3.5">
              {content.registration.benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm text-idl-graphite-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1f9d57] text-[13px] text-white"
                    aria-hidden
                  >
                    ✓
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal>
            <div
              className={cn(
                'rounded-2xl border border-idl-tech-border bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8',
              )}
            >
              <ProfessionalAccountForm registration={content.registration} />
            </div>
          </Reveal>
        </SectionContainer>
      </div>
    </div>
  )
}
