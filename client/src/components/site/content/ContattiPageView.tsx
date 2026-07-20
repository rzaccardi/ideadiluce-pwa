'use client'

import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { ContentBlock, ContentPageContent } from '@/types/site-content'
import { PageHeader } from '@/components/PageHeader'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { ContactPanel } from '@/components/site/content/ContactPanel'
import { SiteLeadForm } from '@/components/site/content/SiteLeadForm'
import { cn } from '@/utils/cn'

function findBlock<K extends ContentBlock['kind']>(
  blocks: ContentBlock[],
  kind: K,
): Extract<ContentBlock, { kind: K }> | undefined {
  return blocks.find((block): block is Extract<ContentBlock, { kind: K }> => block.kind === kind)
}

function FeatureCards({ block }: { block: Extract<ContentBlock, { kind: 'features' }> }) {
  return (
    <div>
      {block.title ? <h2 className="mb-4 text-xl font-bold text-idl-ink">{block.title}</h2> : null}
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.05}>
        {block.items.map((item) => (
          <StaggerItem key={item.title}>
            <div className="h-full rounded-xl border border-idl-tech-border bg-idl-tech-panel p-6">
              {item.num ? (
                <div className="font-mono text-[11px] text-idl-amber">{item.num}</div>
              ) : null}
              <div className={cn('text-base font-bold text-idl-graphite', item.num && 'mt-2')}>
                {item.title}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-idl-muted">{item.description}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}

function CtaBanner({
  block,
  lp,
}: {
  block: Extract<ContentBlock, { kind: 'cta' }>
  lp: (href: string) => string
}) {
  const primaryClass =
    block.variant === 'accent'
      ? 'bg-idl-amber text-white hover:bg-[#b08e3e]'
      : block.variant === 'light'
        ? 'bg-idl-ink text-white hover:bg-idl-ink-soft'
        : 'bg-idl-ink text-white hover:bg-idl-ink-soft'

  return (
    <div className="rounded-2xl border border-idl-path-design-border bg-idl-path-design p-6 sm:p-8">
      <h2 className="text-lg font-bold text-idl-ink">{block.title}</h2>
      {block.description ? <p className="mt-1.5 text-sm text-idl-muted">{block.description}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to={lp(block.primaryHref)}
          className={cn('inline-flex rounded-lg px-5 py-2.5 text-sm font-bold transition', primaryClass)}
        >
          {block.primaryLabel}
        </Link>
        {block.secondaryLabel && block.secondaryHref ? (
          <Link
            to={lp(block.secondaryHref)}
            className="inline-flex rounded-lg border border-idl-border-strong bg-idl-tech-panel px-5 py-2.5 text-sm font-semibold text-idl-graphite transition hover:bg-idl-cream"
          >
            {block.secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

type Props = {
  content: ContentPageContent
}

export function ContattiPageView({ content }: Props) {
  const lp = useLocalePath()
  const features = findBlock(content.blocks, 'features')
  const contact = findBlock(content.blocks, 'contact')
  const leadForm = findBlock(content.blocks, 'lead-form')
  const cta = findBlock(content.blocks, 'cta')

  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <SectionContainer className="py-8 sm:py-10">
          <Reveal immediate>
            <PageHeader title={content.title} description={content.subtitle ?? content.intro} />
          </Reveal>

          {features ? (
            <Reveal className="mt-8 hidden sm:mt-10 lg:block">
              <FeatureCards block={features} />
            </Reveal>
          ) : null}

          {contact || leadForm ? (
            <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-2 lg:items-start lg:gap-10">
              {contact ? (
                <Reveal className="order-2 lg:order-1">
                  <ContactPanel block={contact} />
                </Reveal>
              ) : null}
              {leadForm ? (
                <Reveal className="order-1 lg:order-2">
                  <SiteLeadForm
                    kind={leadForm.form}
                    title={leadForm.title}
                    description={leadForm.description}
                    embedded
                  />
                </Reveal>
              ) : null}
            </div>
          ) : null}

          {cta ? (
            <Reveal className="mt-10 lg:mt-12">
              <CtaBanner block={cta} lp={lp} />
            </Reveal>
          ) : null}
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
