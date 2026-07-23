'use client'

import Image from 'next/image'
import { Link } from '@/lib/navigation'
import type { ContentBlock } from '@/types/site-content'
import { GUIDE_ARTICLE_LAYOUT } from '@/components/site/content/guide-article/guide-article-utils'
import { SITE_PAGE_X_CLASS } from '@/styles/site-ui'
import { cn } from '@/utils/cn'

type Lp = (href: string) => string

function GuideBodySection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn(GUIDE_ARTICLE_LAYOUT.body, SITE_PAGE_X_CLASS, 'py-5 sm:py-6', className)}>
      {children}
    </section>
  )
}

function GuideProseBlock({ block }: { block: Extract<ContentBlock, { kind: 'prose' }> }) {
  return (
    <GuideBodySection>
      <div className="space-y-4 text-base leading-[1.75] text-[#3f3a32]">
        {block.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>
    </GuideBodySection>
  )
}

function GuideImageBlock({ block }: { block: Extract<ContentBlock, { kind: 'image' }> }) {
  const aspect =
    block.layout === 'portrait'
      ? 'aspect-[3/4]'
      : block.layout === 'inline'
        ? 'aspect-[4/3]'
        : 'aspect-[16/10]'

  return (
    <GuideBodySection>
      <figure>
        <div className={cn('relative overflow-hidden rounded', aspect, 'bg-idl-cream')}>
          <Image
            src={block.imageUrl}
            alt={block.alt ?? ''}
            fill
            className="object-cover"
            sizes="(max-width: 820px) 100vw, 820px"
          />
        </div>
        {block.caption ? (
          <figcaption className="mt-2 text-[13px] leading-relaxed text-idl-muted">{block.caption}</figcaption>
        ) : null}
      </figure>
    </GuideBodySection>
  )
}

function GuideSplitBlock({ block }: { block: Extract<ContentBlock, { kind: 'split' }> }) {
  const image = (
    <figure className="m-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded bg-idl-cream">
        <Image src={block.imageUrl} alt={block.alt ?? block.title ?? ''} fill className="object-cover" sizes="(max-width: 820px) 50vw, 400px" />
      </div>
      {block.caption ? (
        <figcaption className="mt-2 text-[13px] text-idl-muted">{block.caption}</figcaption>
      ) : null}
    </figure>
  )
  const copy = (
    <div className="space-y-4 text-base leading-[1.75] text-[#3f3a32]">
      {block.title ? <h2 className="font-serif text-[26px] font-medium text-idl-ink">{block.title}</h2> : null}
      {block.paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
      ))}
    </div>
  )

  return (
    <GuideBodySection>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-8">
        {block.layout === 'image-right' ? (
          <>
            {copy}
            {image}
          </>
        ) : (
          <>
            {image}
            {copy}
          </>
        )}
      </div>
    </GuideBodySection>
  )
}

function GuideGalleryBlock({ block }: { block: Extract<ContentBlock, { kind: 'gallery' }> }) {
  const columns = block.items.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <GuideBodySection>
      {block.title ? <h2 className="mb-3 font-serif text-[26px] font-medium text-idl-ink">{block.title}</h2> : null}
      {block.subtitle ? <p className="mb-4 text-sm text-idl-muted">{block.subtitle}</p> : null}
      <div className={cn('grid gap-4', columns)}>
        {block.items.map((item) => (
          <figure key={item.imageUrl} className="m-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded bg-idl-cream">
              <Image src={item.imageUrl} alt={item.alt ?? ''} fill className="object-cover" sizes="(max-width: 640px) 100vw, 400px" />
            </div>
            {item.caption ? <figcaption className="mt-2 text-[13px] text-idl-muted">{item.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    </GuideBodySection>
  )
}

function GuideBulletsBlock({ block }: { block: Extract<ContentBlock, { kind: 'bullets' }> }) {
  return (
    <GuideBodySection>
      {block.title ? <h2 className="mb-4 font-serif text-[26px] font-medium text-idl-ink">{block.title}</h2> : null}
      <div className="rounded-[10px] border border-[#e4e4e7] bg-white px-5 py-3 sm:px-[22px]">
        <ul className="divide-y divide-[#e4e4e7]">
          {block.items.map((item) => (
            <li key={item} className="py-3 text-[15px] leading-relaxed text-[#3f3a32] first:pt-2 last:pb-2">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </GuideBodySection>
  )
}

function GuideFeaturesBlock({ block }: { block: Extract<ContentBlock, { kind: 'features' }> }) {
  return (
    <GuideBodySection>
      {block.title ? <h2 className="mb-4 font-serif text-[26px] font-medium text-idl-ink">{block.title}</h2> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {block.items.map((item) => (
          <div key={item.title} className="rounded-lg border border-[#e4e4e7] bg-white p-5">
            {item.num ? <div className="font-mono text-[11px] text-idl-amber">{item.num}</div> : null}
            <div className="font-serif text-lg text-idl-ink">{item.title}</div>
            <p className="mt-1.5 text-sm leading-relaxed text-idl-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </GuideBodySection>
  )
}

function GuideStepsBlock({ block }: { block: Extract<ContentBlock, { kind: 'steps' }> }) {
  return (
    <GuideBodySection>
      {block.title ? <h2 className="mb-4 font-serif text-[26px] font-medium text-idl-ink">{block.title}</h2> : null}
      <ol className="space-y-4">
        {block.items.map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-lg border border-[#e4e4e7] bg-white p-4">
            <span className="font-mono text-sm font-bold text-idl-brass">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <div className="font-semibold text-idl-ink">{step.title}</div>
              <p className="mt-1 text-sm text-idl-muted">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </GuideBodySection>
  )
}

export function GuideInspirationSection({
  block,
  lp,
}: {
  block: Extract<ContentBlock, { kind: 'cards' }>
  lp: Lp
}) {
  return (
    <section className="mt-8 bg-idl-design text-[#f5f5f5]">
      <div className={cn(GUIDE_ARTICLE_LAYOUT.wide, SITE_PAGE_X_CLASS, 'py-10 sm:py-14')}>
        <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 font-mono text-[11px] tracking-[0.22em] text-idl-glow uppercase">Ispirazioni</div>
            {block.title ? (
              <h2 className="font-serif text-[clamp(1.5rem,3vw,1.875rem)] font-medium">{block.title}</h2>
            ) : null}
            {block.subtitle ? <p className="mt-2 max-w-2xl text-sm text-[#8a7c60]">{block.subtitle}</p> : null}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {block.items.map((item) => (
            <Link
              key={item.href}
              to={lp(item.href)}
              className="group block text-[#f5f5f5] no-underline"
            >
              {item.imageUrl ? (
                <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded bg-idl-design-elevated">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 50vw, 260px"
                  />
                </div>
              ) : null}
              {item.meta || item.category ? (
                <div className="mb-1 font-mono text-[10px] tracking-[0.08em] text-idl-glow uppercase">
                  {item.meta ?? item.category}
                </div>
              ) : null}
              <div className="font-serif text-lg leading-snug">{item.title}</div>
              {item.description ? (
                <p className="mt-1 text-xs leading-relaxed text-[#8a7c60]">{item.description}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function GuideConversionStrip({
  block,
  lp,
}: {
  block: Extract<ContentBlock, { kind: 'cta' }>
  lp: Lp
}) {
  return (
    <section className="border-b border-[#e4e4e7] bg-idl-paper">
      <div
        className={cn(
          GUIDE_ARTICLE_LAYOUT.wide,
          SITE_PAGE_X_CLASS,
          'flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:py-9',
        )}
      >
        <h2 className="max-w-2xl font-serif text-[clamp(1.125rem,2.5vw,1.3125rem)] font-medium text-idl-ink">
          {block.title}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to={lp(block.primaryHref)}
            className="inline-flex shrink-0 rounded-md bg-idl-brass px-6 py-3 text-sm font-bold text-white no-underline transition hover:bg-idl-brass-light"
          >
            {block.primaryLabel}
          </Link>
          {block.secondaryLabel && block.secondaryHref ? (
            <Link
              to={lp(block.secondaryHref)}
              className="inline-flex rounded-md border border-[#e4e4e7] bg-white px-5 py-3 text-sm font-semibold text-idl-graphite no-underline transition hover:border-idl-brass"
            >
              {block.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function GuideArticleBlock({ block, lp }: { block: ContentBlock; lp: Lp }) {
  switch (block.kind) {
    case 'prose':
      return <GuideProseBlock block={block} />
    case 'image':
      return <GuideImageBlock block={block} />
    case 'split':
      return <GuideSplitBlock block={block} />
    case 'gallery':
      return <GuideGalleryBlock block={block} />
    case 'bullets':
      return <GuideBulletsBlock block={block} />
    case 'features':
      return <GuideFeaturesBlock block={block} />
    case 'steps':
      return <GuideStepsBlock block={block} />
    case 'cards':
      return <GuideInspirationSection block={block} lp={lp} />
    case 'cta':
      return <GuideConversionStrip block={block} lp={lp} />
    default:
      return null
  }
}
