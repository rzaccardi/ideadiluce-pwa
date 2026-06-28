'use client'

import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { ContentPageContent } from '@/types/site-content'
import { ContentBlockList } from '@/components/site/content/ContentBlockList'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Reveal } from '@/components/motion'
import { cn } from '@/utils/cn'

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10.5px] tracking-[0.18em] text-idl-brass-light uppercase">{children}</div>
  )
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
            <ContentBlockList blocks={[block]} lp={lp} />
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
