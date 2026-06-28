'use client'

import { Link } from '@/lib/navigation'
import type { ContentBlock } from '@/types/site-content'
import { SiteLeadForm } from '@/components/site/content/SiteLeadForm'
import { ContactPanel } from '@/components/site/content/ContactPanel'
import { Stagger, StaggerItem } from '@/components/motion'
import { ui } from '@/lib/ui-classes'
import { cn } from '@/utils/cn'

type Props = {
  blocks: ContentBlock[]
  lp: (href: string) => string
  tone?: 'default' | 'guide'
}

function BlockRenderer({
  block,
  lp,
  tone,
}: {
  block: ContentBlock
  lp: (href: string) => string
  tone: 'default' | 'guide'
}) {
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
        <div className={tone === 'guide' ? 'max-w-4xl' : undefined}>
          {block.title ? <h2 className="mb-4 text-xl font-bold text-idl-ink">{block.title}</h2> : null}
          <Stagger
            className={cn(
              'grid gap-4',
              tone === 'guide' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4',
            )}
            stagger={0.05}
          >
            {block.items.map((item) => (
              <StaggerItem key={item.title}>
                <div className="h-full rounded-xl border border-idl-tech-border bg-white p-5 sm:p-6">
                  {item.num ? (
                    <div className="font-mono text-[11px] text-idl-amber">{item.num}</div>
                  ) : null}
                  <div
                    className={cn(
                      tone === 'guide' && !item.num
                        ? 'font-mono text-[13px] font-semibold text-idl-brass'
                        : 'text-base font-bold text-idl-graphite',
                      item.num && 'mt-2',
                    )}
                  >
                    {item.title}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-idl-muted sm:text-sm">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )
    case 'cards':
      return (
        <div className={tone === 'guide' ? 'max-w-4xl' : undefined}>
          {block.title ? <h2 className="mb-1 text-xl font-bold text-idl-ink">{block.title}</h2> : null}
          {block.subtitle ? <p className="mb-4 text-sm text-idl-muted">{block.subtitle}</p> : null}
          <div
            className={cn(
              'grid gap-4',
              tone === 'guide' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4',
            )}
          >
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
        <div className={cn(ui.panelMuted, tone === 'guide' && 'max-w-3xl')}>
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
        <div className={cn(ui.panel, tone === 'guide' && 'max-w-3xl')}>
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
        <div
          className={cn(
            ui.panel,
            block.variant === 'light' && 'bg-idl-cream',
            tone === 'guide' && 'max-w-3xl border-idl-tech-border bg-[#faf6ef]/40',
          )}
        >
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
      return <ContactPanel block={block} />
    case 'lead-form':
      return <SiteLeadForm kind={block.form} title={block.title} description={block.description} />
    default:
      return null
  }
}

export function ContentBlockList({ blocks, lp, tone = 'default' }: Props) {
  return (
    <>
      {blocks.map((block, i) => (
        <BlockRenderer key={`${block.kind}-${i}`} block={block} lp={lp} tone={tone} />
      ))}
    </>
  )
}
