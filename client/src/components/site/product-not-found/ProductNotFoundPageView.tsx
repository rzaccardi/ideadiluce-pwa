'use client'

import { Link } from '@/lib/navigation'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { ContentBlock, ContentPageContent } from '@/types/site-content'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'
import { Reveal } from '@/components/motion'
import { ProductNotFoundLeadForm } from '@/components/site/product-not-found/ProductNotFoundLeadForm'
function findBlock<K extends ContentBlock['kind']>(
  blocks: ContentBlock[],
  kind: K,
): Extract<ContentBlock, { kind: K }> | undefined {
  return blocks.find((block): block is Extract<ContentBlock, { kind: K }> => block.kind === kind)
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20.5l1.3-5.4A8 8 0 1 1 21 12Z" />
    </svg>
  )
}

type Props = {
  content: ContentPageContent
}

export function ProductNotFoundPageView({ content }: Props) {
  const { t } = useI18n()
  const lp = useLocalePath()
  const leadForm = findBlock(content.blocks, 'lead-form')
  const steps = findBlock(content.blocks, 'steps')
  const contact = findBlock(content.blocks, 'contact')

  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper" className="bg-[#f3f2ee]">
        <Reveal immediate className="relative overflow-hidden bg-idl-ink text-idl-cream">
          <div
            className="pointer-events-none absolute -top-16 right-[18%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(201, 162, 75,0.18)_0%,rgba(201, 162, 75,0)_68%)]"
            aria-hidden
          />
          <SectionContainer className="relative z-[1] max-w-3xl py-11 text-center sm:py-12">
            {content.eyebrow ? (
              <div className="mb-4 flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-idl-brass sm:w-[34px]" aria-hidden />
                <span className="font-mono text-[11px] tracking-[0.22em] text-idl-brass">
                  {content.eyebrow}
                </span>
                <span className="h-px w-8 bg-idl-brass sm:w-[34px]" aria-hidden />
              </div>
            ) : null}
            <h1 className="font-serif text-[clamp(1.9rem,4.5vw,2.625rem)] font-medium leading-[1.08] tracking-tight">
              {content.title}
            </h1>
            {content.subtitle ? (
              <p className="mx-auto mt-3.5 max-w-xl text-base leading-relaxed text-[#b0b0b4] sm:text-[16px]">
                {content.subtitle}
              </p>
            ) : null}
            {content.heroBadges?.length ? (
              <div className="mt-5 inline-flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-[12.5px] text-[#8f8f93]">
                {content.heroBadges.map((badge) => (
                  <span key={badge}>● {badge}</span>
                ))}
              </div>
            ) : null}
          </SectionContainer>
        </Reveal>

        <SectionContainer className="py-10 sm:py-12">
          <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
            <Reveal>
              <ProductNotFoundLeadForm
                title={leadForm?.title}
                description={leadForm?.description}
              />
            </Reveal>

            <div className="flex flex-col gap-5 lg:sticky lg:top-24">
              {steps ? (
                <Reveal>
                  <div className="rounded-[14px] border border-idl-tech-border bg-white p-6 sm:p-7">
                    <h2 className="mb-4 text-base font-extrabold tracking-tight text-idl-ink">
                      {steps.title ?? t('productNotFound.stepsTitle')}
                    </h2>
                    <ol className="flex flex-col gap-4">
                      {steps.items.map((step, index) => (
                        <li key={step.title} className="flex gap-3">
                          <span className="shrink-0 font-mono text-xs font-bold text-idl-amber">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-idl-ink">{step.title}</div>
                            <p className="mt-0.5 text-[12.5px] leading-relaxed text-idl-muted">
                              {step.description}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </Reveal>
              ) : null}

              {contact ? (
                <Reveal>
                  <div className="rounded-[14px] bg-idl-ink p-6 text-idl-cream sm:p-7">
                    <div className="mb-3.5 font-mono text-[10.5px] tracking-[0.14em] text-idl-brass">
                      {t('productNotFound.preferTalk')}
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {contact.whatsapp ? (
                        <a
                          href={contact.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-[9px] bg-[#1f9d57] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#188a4a]"
                        >
                          <WhatsAppIcon />
                          {t('productNotFound.whatsapp')}
                        </a>
                      ) : null}
                      {contact.phone ? (
                        <a
                          href={contact.phoneHref ?? `tel:${contact.phone}`}
                          className="flex items-center gap-3 rounded-[9px] border border-white/20 px-4 py-3 text-sm font-semibold text-idl-cream transition hover:border-idl-brass/50"
                        >
                          Tel: {contact.phone}
                        </a>
                      ) : null}
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-3 rounded-[9px] border border-white/20 px-4 py-3 text-sm font-semibold text-idl-cream transition hover:border-idl-brass/50"
                        >
                          {contact.email}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </Reveal>
              ) : null}

              <Reveal>
                <div className="rounded-[14px] border border-[#f0e3d0] bg-[#fbf4ea] p-5 sm:p-6">
                  <div className="text-sm font-bold text-idl-ink">{t('productNotFound.professionalsTitle')}</div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#7a6a52]">
                    {t('productNotFound.professionalsBody')}
                  </p>
                  <Link
                    to={lp('/professionisti')}
                    className="mt-3 inline-flex text-sm font-bold text-idl-brass hover:text-idl-amber"
                  >
                    {t('productNotFound.professionalsCta')} →
                  </Link>
                </div>
              </Reveal>

              <Reveal>
                <div className="overflow-hidden rounded-[14px] border border-idl-tech-border bg-white">
                  <div
                    className="aspect-[16/9] bg-[linear-gradient(135deg,#f0efe9_0%,#d8cbb8_55%,#c4b49a_100%)]"
                    aria-hidden
                  />
                  <div className="p-5">
                    <div className="text-sm font-extrabold text-idl-ink">
                      {t('productNotFound.showroomTitle')}
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-idl-muted">
                      {t('productNotFound.showroomBody')}
                    </p>
                    <Link
                      to={lp('/showroom')}
                      className="mt-2.5 inline-flex text-sm font-bold text-idl-brass hover:text-idl-amber"
                    >
                      {t('productNotFound.showroomCta')} →
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
