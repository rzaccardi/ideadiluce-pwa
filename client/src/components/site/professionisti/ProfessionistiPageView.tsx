'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useSnapshot } from 'valtio/react'
import { authStore } from '@/features/auth'
import { api } from '@/api/endpoints'
import { fetchCart } from '@/features/cart'
import { ApiRequestError } from '@/types/api'
import type { ProfessionistiPageContent } from '@/types/site-content'
import { ProfessionalAccountForm } from './ProfessionalAccountForm'
import { SectionContainer } from '../primitives'
import { SiteCardHeading, SiteHeading, SiteSectionSrTitle } from '../SiteHeading'
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
  const [reorderText, setReorderText] = useState('')
  const [previewMatched, setPreviewMatched] = useState<number | null>(null)
  const [previewUnmatched, setPreviewUnmatched] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const accountHref = auth.me ? '/account' : content.hero.secondaryCta.href
  const canUseQuickReorder = auth.me != null

  const previewFootnote = useMemo(() => {
    if (!canUseQuickReorder) return content.quickReorder.footnote
    if (previewLoading) return 'Verifica codici in corso…'
    if (previewMatched == null) return content.quickReorder.footnote
    if (previewMatched === 0 && (previewUnmatched ?? 0) > 0) {
      return `Nessun codice riconosciuto · ${previewUnmatched} non trovati`
    }
    if ((previewUnmatched ?? 0) > 0) {
      return `${previewMatched} prodotti riconosciuti · ${previewUnmatched} non trovati`
    }
    return `${previewMatched} prodotti riconosciuti`
  }, [
    canUseQuickReorder,
    content.quickReorder.footnote,
    previewLoading,
    previewMatched,
    previewUnmatched,
  ])

  useEffect(() => {
    if (!canUseQuickReorder || !reorderText.trim()) {
      setPreviewMatched(null)
      setPreviewUnmatched(null)
      return
    }

    const timer = window.setTimeout(() => {
      setPreviewLoading(true)
      void api.catalog
        .resolveCodes({ text: reorderText })
        .then((result) => {
          setPreviewMatched(result.matched.length)
          setPreviewUnmatched(result.unmatched.length)
        })
        .catch(() => {
          setPreviewMatched(null)
          setPreviewUnmatched(null)
        })
        .finally(() => setPreviewLoading(false))
    }, 500)

    return () => window.clearTimeout(timer)
  }, [canUseQuickReorder, reorderText])

  async function onQuickReorder() {
    if (!auth.me) {
      toast.message(content.quickReorder.loginHint)
      scrollToRegistration()
      return
    }

    if (!reorderText.trim()) {
      toast.message('Incolla almeno un codice prodotto.')
      return
    }

    setSubmitLoading(true)
    try {
      const result = await api.cart.quickReorder({ text: reorderText })
      await fetchCart({ force: true, skipMirrorCheck: true })

      const parts = [`${result.added} prodotti aggiunti al carrello`]
      if (result.unmatched.length > 0) {
        parts.push(`${result.unmatched.length} codici non riconosciuti`)
      }
      if (result.skipped.length > 0) {
        parts.push(`${result.skipped.length} righe non aggiunte`)
      }
      toast.success(parts.join(' · '))
    } catch (e) {
      const message =
        e instanceof ApiRequestError
          ? (e.userMessage ?? e.message)
          : 'Impossibile completare il riordino rapido.'
      toast.error(message)
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="bg-idl-tech-panel">
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
                className="rounded-lg bg-idl-amber px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#b08e3e]"
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
            <SiteHeading
              level={2}
              className="font-mono text-[10.5px] tracking-[0.14em] text-[#8b919b]"
            >
              {content.quickReorder.title}
            </SiteHeading>
            <textarea
              value={reorderText}
              onChange={(e) => setReorderText(e.target.value)}
              rows={5}
              className="mt-3.5 w-full resize-y rounded-lg border border-[#2a2f37] bg-idl-graphite px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-idl-muted outline-none focus:border-idl-amber/50"
              placeholder={content.quickReorder.placeholder}
            />
            <button
              type="button"
              onClick={() => void onQuickReorder()}
              disabled={submitLoading || previewLoading}
              className="mt-3 w-full rounded-lg bg-[#eef1f4] py-3 text-center text-sm font-bold text-idl-graphite transition hover:bg-idl-tech-panel disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLoading ? 'Aggiunta in corso…' : content.quickReorder.ctaLabel}
            </button>
            <p className="mt-2.5 text-center text-[11.5px] text-idl-muted">{previewFootnote}</p>
          </div>
        </SectionContainer>
      </Reveal>

      <SectionContainer className="py-12 sm:py-14">
        <SiteSectionSrTitle>Vantaggi per professionisti</SiteSectionSrTitle>
        <Stagger immediate className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.05}>
          {content.features.map((item) => (
            <StaggerItem key={item.num}>
              <div className="h-full rounded-xl border border-idl-tech-border bg-idl-tech-panel p-6">
                <div className="font-mono text-[11px] text-idl-amber">{item.num}</div>
                <SiteCardHeading className="mt-2 text-idl-graphite">{item.title}</SiteCardHeading>
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
                className="rounded-xl border border-idl-path-design-border bg-idl-tech-panel p-6"
              >
                <SiteCardHeading className="text-[17px] text-idl-ink">{item.title}</SiteCardHeading>
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
                'rounded-2xl border border-idl-tech-border bg-idl-tech-panel p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8',
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
