'use client'

import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { ContentBlock, ContentPageContent } from '@/types/site-content'
import { SiteLeadForm } from '@/components/site/content/SiteLeadForm'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { ui } from '@/lib/ui-classes'
import { cn } from '@/utils/cn'

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10.5px] tracking-[0.18em] text-idl-brass-light uppercase">{children}</div>
  )
}

function BlockRenderer({ block, lp }: { block: ContentBlock; lp: (href: string) => string }) {
  switch (block.kind) {
    case 'prose':
      return (
        <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-idl-ink-muted">
          {block.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      )
    case 'features':
      return (
        <div>
          {block.title ? <h2 className="mb-4 text-xl font-bold text-idl-ink">{block.title}</h2> : null}
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.05}>
            {block.items.map((item) => (
              <StaggerItem key={item.title}>
                <div className={cn(ui.panel, 'h-full')}>
                  {item.num ? (
                    <div className="font-mono text-xs text-idl-brass">{item.num}</div>
                  ) : null}
                  <div className="mt-2 font-semibold text-idl-ink">{item.title}</div>
                  <p className="mt-1 text-sm text-idl-muted">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )
    case 'cards':
      return (
        <div>
          {block.title ? <h2 className="mb-1 text-xl font-bold text-idl-ink">{block.title}</h2> : null}
          {block.subtitle ? <p className="mb-4 text-sm text-idl-muted">{block.subtitle}</p> : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {block.items.map((item) => (
              <Link
                key={item.href}
                to={lp(item.href)}
                className={cn(ui.card, 'block p-5 hover:border-idl-brass')}
              >
                <div className="font-semibold text-idl-ink">{item.title}</div>
                {item.description ? (
                  <p className="mt-1 text-sm text-idl-muted">{item.description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      )
    case 'bullets':
      return (
        <div className={ui.panelMuted}>
          {block.title ? <h2 className="mb-3 font-semibold text-idl-ink">{block.title}</h2> : null}
          <ul className="space-y-2 text-sm text-idl-graphite">
            {block.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-idl-brass">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )
    case 'steps':
      return (
        <div className={ui.panel}>
          {block.title ? <h2 className="mb-4 text-lg font-bold text-idl-ink">{block.title}</h2> : null}
          <ol className="space-y-4">
            {block.items.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="font-mono text-sm font-bold text-idl-brass">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div className="font-semibold text-idl-ink">{step.title}</div>
                  <p className="text-sm text-idl-muted">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )
    case 'cta': {
      const primaryClass =
        block.variant === 'accent'
          ? 'bg-idl-amber text-white hover:brightness-105'
          : block.variant === 'dark'
            ? 'bg-idl-ink text-white hover:bg-idl-ink-soft'
            : 'bg-idl-ink text-white hover:bg-idl-ink-soft'
      return (
        <div className={cn(ui.panel, block.variant === 'light' && 'bg-idl-cream')}>
          <h2 className="text-lg font-bold text-idl-ink">{block.title}</h2>
          {block.description ? <p className="mt-1 text-sm text-idl-muted">{block.description}</p> : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to={lp(block.primaryHref)}
              className={cn('inline-flex rounded-md px-4 py-2 text-sm font-bold', primaryClass)}
            >
              {block.primaryLabel}
            </Link>
            {block.secondaryLabel && block.secondaryHref ? (
              <Link
                to={lp(block.secondaryHref)}
                className="inline-flex rounded-md border border-idl-border-strong bg-white px-4 py-2 text-sm font-semibold text-idl-graphite hover:bg-idl-cream"
              >
                {block.secondaryLabel}
              </Link>
            ) : null}
          </div>
        </div>
      )
    }
    case 'contact':
      return (
        <div className={cn(ui.panel, 'grid gap-6 sm:grid-cols-2')}>
          <div>
            {block.company ? <div className="font-serif text-xl text-idl-ink">{block.company}</div> : null}
            {block.vat ? <p className="mt-2 text-sm text-idl-muted">P.IVA {block.vat}</p> : null}
            {block.rea ? <p className="text-sm text-idl-muted">REA {block.rea}</p> : null}
            {block.address ? <p className="mt-4 text-sm leading-relaxed text-idl-graphite">{block.address}</p> : null}
          </div>
          <div className="space-y-3 text-sm">
            {block.phone ? (
              <p>
                <span className={ui.labelSm}>Telefono</span>
                <br />
                <a href={block.phoneHref ?? `tel:${block.phone}`} className="font-semibold text-idl-brass">
                  {block.phone}
                </a>
              </p>
            ) : null}
            {block.email ? (
              <p>
                <span className={ui.labelSm}>Email</span>
                <br />
                <a href={`mailto:${block.email}`} className="font-semibold text-idl-brass">
                  {block.email}
                </a>
              </p>
            ) : null}
            {block.hours ? (
              <p>
                <span className={ui.labelSm}>Orari</span>
                <br />
                <span className="text-idl-graphite">{block.hours}</span>
              </p>
            ) : null}
            {block.whatsapp ? (
              <a
                href={block.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-md bg-[#1f9d57] px-4 py-2 text-sm font-bold text-white"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      )
    case 'lead-form':
      return <SiteLeadForm kind={block.form} title={block.title} description={block.description} />
    default:
      return null
  }
}

type Props = {
  content: ContentPageContent
  breadcrumb?: Array<{ label: string; to?: string }>
}

export function ContentPageView({ content, breadcrumb }: Props) {
  const lp = useLocalePath()
  const isHero = content.layout === 'hero-dark'
  const isArticle = content.layout === 'article'
  const isLegal = content.layout === 'legal'

  return (
    <div>
      {breadcrumb?.length ? <Breadcrumb items={breadcrumb} /> : null}

      {isHero ? (
        <Reveal immediate className="-mx-[var(--site-gutter)] mb-10 bg-idl-ink px-[var(--site-gutter)] py-12 text-idl-cream sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            {content.eyebrow ? (
              <div className="font-mono text-[11px] tracking-[0.22em] text-idl-brass">{content.eyebrow}</div>
            ) : null}
            <h1 className="mt-4 font-serif text-3xl font-medium sm:text-4xl">{content.title}</h1>
            {content.subtitle ? (
              <p className="mt-4 text-base leading-relaxed text-idl-cream/80 sm:text-lg">{content.subtitle}</p>
            ) : null}
            {content.heroBadges?.length ? (
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-idl-cream/70">
                {content.heroBadges.map((b) => (
                  <span key={b}>● {b}</span>
                ))}
              </div>
            ) : null}
          </div>
        </Reveal>
      ) : (
        <Reveal immediate className="mb-8">
          {content.eyebrow && isArticle ? <Eyebrow>{content.eyebrow}</Eyebrow> : null}
          <h1
            className={cn(
              'font-serif font-medium tracking-tight text-idl-ink',
              isLegal ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl',
              content.eyebrow && isArticle && 'mt-3',
            )}
          >
            {content.title}
          </h1>
          {content.subtitle ? <p className="mt-2 max-w-3xl text-sm text-idl-muted sm:text-base">{content.subtitle}</p> : null}
          {content.intro ? (
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-idl-ink-muted">{content.intro}</p>
          ) : null}
        </Reveal>
      )}

      <div className="space-y-10 pb-12">
        {content.blocks.map((block, i) => (
          <Reveal key={`${block.kind}-${i}`}>
            <BlockRenderer block={block} lp={lp} />
          </Reveal>
        ))}
      </div>

      {content.cta ? (
        <Reveal>
          <Link to={lp(content.cta.href)} className="text-sm font-bold text-idl-brass">
            {content.cta.label}
          </Link>
        </Reveal>
      ) : null}
    </div>
  )
}
