'use client'

import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { ContentPageContent } from '@/types/site-content'
import { ContentBlockList } from '@/components/site/content/ContentBlockList'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Reveal } from '@/components/motion'
import { cn } from '@/utils/cn'

type Props = {
  content: ContentPageContent
  breadcrumb?: Array<{ label: string; to?: string }>
}

function parseGuideEyebrow(eyebrow?: string) {
  if (!eyebrow) return { category: null, meta: null }
  const parts = eyebrow.split('·').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return { category: parts[0], meta: parts.slice(1).join(' · ') }
  }
  return { category: parts[0] ?? null, meta: null }
}

function GuideBadge({ children, variant }: { children: React.ReactNode; variant: 'category' | 'meta' }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-[5px] border px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.06em] uppercase',
        variant === 'category'
          ? 'border-[#ece2d2] bg-[#faf6ef] text-idl-brass'
          : 'border-idl-border font-normal tracking-normal text-idl-muted normal-case',
      )}
    >
      {children}
    </span>
  )
}

export function GuideArticlePageView({ content, breadcrumb }: Props) {
  const lp = useLocalePath()
  const { category, meta } = parseGuideEyebrow(content.eyebrow)
  const crumbs = breadcrumb ?? [{ label: 'Guide', to: '/guide' }, { label: content.title }]

  return (
    <div>
      <Breadcrumb items={crumbs} />

      <Reveal immediate>
        <Link
          to={lp('/guide')}
          className="mb-6 inline-flex text-sm font-bold text-idl-brass transition hover:text-idl-brass/80"
        >
          ← Tutte le guide
        </Link>

        <div className="overflow-hidden rounded-xl border border-idl-tech-border bg-white">
          <div className="h-2 bg-gradient-to-r from-[#f4c97a] to-[#e7b56a]" aria-hidden />
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            {category || meta ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {category ? <GuideBadge variant="category">{category}</GuideBadge> : null}
                {meta ? <GuideBadge variant="meta">{meta}</GuideBadge> : null}
              </div>
            ) : null}
            <h1 className="max-w-3xl font-serif text-[clamp(1.75rem,3.5vw,2.25rem)] font-medium leading-[1.15] tracking-tight text-idl-ink">
              {content.title}
            </h1>
            {content.subtitle ? (
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-idl-muted sm:text-base">
                {content.subtitle}
              </p>
            ) : null}
            {content.intro ? (
              <div className="mt-4 max-w-3xl rounded-lg border border-idl-tech-border bg-idl-cream/60 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-idl-brass">Risposta breve</p>
                <p className="mt-2 text-[15px] leading-relaxed text-idl-ink-muted">{content.intro}</p>
              </div>
            ) : null}
          </div>
        </div>
      </Reveal>

      <div className="space-y-10 py-10">
        {content.blocks.map((block, i) => (
          <Reveal key={`${block.kind}-${i}`}>
            <ContentBlockList blocks={[block]} lp={lp} tone="guide" />
          </Reveal>
        ))}
      </div>

      <Reveal className="border-t border-idl-border pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to={lp('/guide')}
            className="text-sm font-bold text-idl-brass transition hover:text-idl-brass/80"
          >
            ← Torna alle guide
          </Link>
          {content.cta ? (
            <Link to={lp(content.cta.href)} className="text-sm font-bold text-idl-brass">
              {content.cta.label}
            </Link>
          ) : null}
        </div>
      </Reveal>
    </div>
  )
}
