'use client'

import Image from 'next/image'
import { ExternalLink } from '@/lib/link-title'
import { Link } from '@/lib/navigation'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { isExternalHref } from '@/lib/href'
import type { ContentBlock, ContentPageContent } from '@/types/site-content'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import {
  CHI_SIAMO_SHOWROOM,
  CHI_SIAMO_SHOWROOM_CTA,
  CHI_SIAMO_STATS,
  CHI_SIAMO_SUPPORT_CTA,
} from '@/components/site/content/chi-siamo-fallbacks'
import { SiteCardHeading, SiteHeading, SiteSectionSrTitle } from '@/components/site/SiteHeading'
import { cn } from '@/utils/cn'

function findBlock<K extends ContentBlock['kind']>(
  blocks: ContentBlock[],
  kind: K,
): Extract<ContentBlock, { kind: K }> | undefined {
  return blocks.find((block): block is Extract<ContentBlock, { kind: K }> => block.kind === kind)
}

type BoImageProps = {
  src?: string
  alt: string
  className?: string
  aspectClass?: string
  sizes?: string
  rounded?: string
  fill?: boolean
}

function BoImage({
  src,
  alt,
  className,
  aspectClass = 'aspect-[4/5]',
  sizes = '(max-width: 768px) 100vw, 640px',
  rounded = 'rounded-md',
  fill = false,
}: BoImageProps) {
  const trimmed = src?.trim()

  const placeholder = (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-idl-ink p-6 text-center">
      <svg
        viewBox="0 0 24 24"
        className="h-8 w-8 text-idl-brass/60"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
        <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L9 15" />
      </svg>
      <span className="font-mono text-[10px] tracking-[0.14em] text-idl-brass-light uppercase">
        {alt}
      </span>
    </div>
  )

  if (fill) {
    return (
      <div className={cn('absolute inset-0 overflow-hidden', rounded, className)}>
        {trimmed ? (
          <Image src={trimmed} alt={alt} fill className="object-cover" sizes={sizes} />
        ) : (
          placeholder
        )}
      </div>
    )
  }

  if (!trimmed) {
    return (
      <div className={cn('relative overflow-hidden bg-idl-ink', aspectClass, rounded, className)}>
        {placeholder}
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', aspectClass, rounded, className)}>
      <Image src={trimmed} alt={alt} fill className="object-cover" sizes={sizes} />
    </div>
  )
}

function ShowroomMapCard({
  showroom,
  mapAlt,
}: {
  showroom: Extract<ContentBlock, { kind: 'split' }>
  mapAlt: string
}) {
  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-[14px] sm:min-h-[380px] lg:h-full">
      <BoImage
        src={showroom.imageUrl}
        alt={showroom.alt ?? showroom.title ?? mapAlt}
        fill
        rounded="rounded-[14px]"
        sizes="(max-width: 1024px) 100vw, 640px"
      />
      <div className="absolute right-5 bottom-5 left-5 max-w-[calc(100%-2.5rem)] rounded-[10px] bg-idl-ink/90 px-5 py-4 text-idl-cream backdrop-blur-sm sm:left-auto sm:max-w-[18rem]">
        {showroom.title ? (
          <SiteHeading level={3} className="font-serif text-lg">
            {showroom.title}
          </SiteHeading>
        ) : null}
        {showroom.paragraphs[0] ? (
          <p className="mt-1 text-[12.5px] text-idl-cream/75">{showroom.paragraphs[0]}</p>
        ) : null}
      </div>
    </div>
  )
}

type Props = {
  content: ContentPageContent
}

export function ChiSiamoPageView({ content }: Props) {
  const { t } = useI18n()
  const lp = useLocalePath()

  const prose = findBlock(content.blocks, 'prose')
  const stats = findBlock(content.blocks, 'stats') ?? CHI_SIAMO_STATS
  const features = findBlock(content.blocks, 'features')
  const contact = findBlock(content.blocks, 'contact')
  const showroom = findBlock(content.blocks, 'split') ?? CHI_SIAMO_SHOWROOM
  const supportCta = findBlock(content.blocks, 'cta') ?? CHI_SIAMO_SUPPORT_CTA
  const showroomCta = content.cta ?? CHI_SIAMO_SHOWROOM_CTA

  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper" className="bg-idl-cream">
        {/* Hero */}
        <SectionContainer className="py-10 sm:py-12 lg:py-14">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal immediate>
              <div>
                {content.eyebrow ? (
                  <div className="mb-4 flex items-center gap-3">
                    <span className="h-px w-10 bg-idl-brass" aria-hidden />
                    <span className="font-mono text-[11px] tracking-[0.22em] text-idl-brass uppercase">
                      {content.eyebrow}
                    </span>
                  </div>
                ) : null}
                <h1 className="font-serif text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.06] tracking-tight text-idl-ink">
                  {content.title}{' '}
                  {content.titleAccent ? (
                    <span className="italic text-idl-brass">{content.titleAccent}</span>
                  ) : null}
                </h1>
                {content.intro ? (
                  <p className="mt-5 text-[17px] leading-relaxed text-idl-ink-muted">{content.intro}</p>
                ) : null}
                {prose?.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="mt-4 text-base leading-relaxed text-idl-ink-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Reveal>

            <Reveal immediate delay={0.08}>
              <BoImage
                src={content.coverImage?.imageUrl}
                alt={content.coverImage?.alt ?? t('chiSiamo.heroImageAlt')}
                aspectClass="aspect-[4/5] w-full"
                rounded="rounded-md"
              />
            </Reveal>
          </div>
        </SectionContainer>

        {/* KPI / numeri */}
        <Reveal className="bg-idl-ink text-idl-cream">
          <SectionContainer className="py-10 sm:py-12">
            <Stagger
              className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4 lg:gap-10"
              stagger={0.06}
            >
              {stats.items.map((item) => (
                <StaggerItem key={`${item.value}-${item.label}`}>
                  <div className="font-serif text-[clamp(2rem,4vw,2.625rem)] font-medium text-idl-brass">
                    {item.value}
                  </div>
                  <div className="mt-1 text-[13.5px] text-idl-cream/70">{item.label}</div>
                </StaggerItem>
              ))}
            </Stagger>
          </SectionContainer>
        </Reveal>

        {/* Value cards 01–04 */}
        {features?.items.length ? (
          <SectionContainer className="py-10 sm:py-14">
            <SiteSectionSrTitle>{features.title ?? 'Cosa ci distingue'}</SiteSectionSrTitle>
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.05}>
              {features.items.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="h-full rounded-xl border border-idl-path-design-border bg-idl-tech-panel p-6">
                    {item.num ? (
                      <div className="font-mono text-xs text-idl-brass">{item.num}</div>
                    ) : null}
                    <SiteCardHeading className={cn('text-idl-ink', item.num && 'mt-4')}>
                      {item.title}
                    </SiteCardHeading>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-idl-muted">{item.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </SectionContainer>
        ) : null}

        {/* Dati aziendali + card showroom (destra) */}
        <SectionContainer className="pb-10 sm:pb-14">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
            {contact ? (
              <Reveal>
                <div className="h-full rounded-[14px] border border-idl-path-design-border bg-idl-tech-panel p-7 sm:p-8">
                  <div className="font-mono text-[11px] tracking-[0.14em] text-idl-brass uppercase">
                    {t('chiSiamo.companyData')}
                  </div>
                  {contact.company ? (
                    <div className="mt-4 font-serif text-2xl font-medium text-idl-ink">{contact.company}</div>
                  ) : null}
                  {contact.vat || contact.rea ? (
                    <p className="mt-1.5 text-[13px] text-idl-muted">
                      {contact.vat ? `P.IVA ${contact.vat}` : null}
                      {contact.vat && contact.rea ? ' · ' : null}
                      {contact.rea ? `REA ${contact.rea}` : null}
                    </p>
                  ) : null}
                  {contact.address ? (
                    <p className="mt-4 border-b border-idl-border/80 pb-4 text-sm leading-relaxed whitespace-pre-line text-idl-graphite">
                      {contact.address}
                    </p>
                  ) : null}

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {contact.phone ? (
                      <div>
                        <div className="text-xs text-idl-muted">{t('common.phone')}</div>
                        <ExternalLink
                          href={contact.phoneHref ?? `tel:${contact.phone.replace(/\s/g, '')}`}
                          className="mt-1 block text-sm font-bold text-idl-brass transition hover:text-idl-amber"
                        >
                          {contact.phone}
                        </ExternalLink>
                      </div>
                    ) : null}
                    {contact.email ? (
                      <div>
                        <div className="text-xs text-idl-muted">{t('common.email')}</div>
                        <ExternalLink
                          href={`mailto:${contact.email}`}
                          className="mt-1 block text-sm font-bold text-idl-brass transition hover:text-idl-amber"
                        >
                          {contact.email}
                        </ExternalLink>
                      </div>
                    ) : null}
                  </div>

                  {contact.hours ? (
                    <div className="mt-4">
                      <div className="text-xs text-idl-muted">{t('chiSiamo.hours')}</div>
                      <p className="mt-1 text-sm text-idl-graphite">{contact.hours}</p>
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-wrap gap-2.5">
                    {contact.whatsapp ? (
                      <ExternalLink
                        href={contact.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-lg bg-[#1f9d57] px-5 py-3 text-[13.5px] font-bold text-white transition hover:bg-[#188a4a]"
                      >
                        {t('chiSiamo.whatsapp')}
                      </ExternalLink>
                    ) : null}
                    <Link
                      to={lp('/contatti')}
                      className="inline-flex rounded-lg border border-idl-border-strong bg-idl-tech-panel px-5 py-3 text-[13.5px] font-bold text-idl-ink transition hover:bg-idl-cream"
                    >
                      {t('chiSiamo.writeUs')}
                    </Link>
                  </div>
                </div>
              </Reveal>
            ) : null}

            <Reveal delay={0.06}>
              <ShowroomMapCard showroom={showroom} mapAlt={t('chiSiamo.mapAlt')} />
            </Reveal>
          </div>

          <Reveal className="mt-8 text-center">
            {isExternalHref(showroomCta.href) ? (
              <ExternalLink
                href={showroomCta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-idl-brass transition hover:text-idl-amber"
              >
                {showroomCta.label}
              </ExternalLink>
            ) : (
              <Link
                to={lp(showroomCta.href)}
                className="text-sm font-bold text-idl-brass transition hover:text-idl-amber"
              >
                {showroomCta.label}
              </Link>
            )}
          </Reveal>
        </SectionContainer>

        {/* On-demand CTA band */}
        <Reveal className="bg-idl-ink text-idl-cream">
          <SectionContainer className="flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center sm:py-12">
            <div className="max-w-xl">
              <h2 className="font-serif text-[clamp(1.375rem,3vw,1.625rem)] font-medium">
                {supportCta.title}
              </h2>
              {supportCta.description ? (
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-idl-cream/75">
                  {supportCta.description}
                </p>
              ) : null}
            </div>
            <Link
              to={lp(supportCta.primaryHref)}
              className="inline-flex shrink-0 rounded-lg bg-idl-brass px-6 py-3.5 text-[14.5px] font-bold text-idl-ink transition hover:bg-idl-amber"
            >
              {supportCta.primaryLabel}
            </Link>
          </SectionContainer>
        </Reveal>
      </PageFlexBody>
    </PageFlexShell>
  )
}
