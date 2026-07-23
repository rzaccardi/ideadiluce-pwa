'use client'

import { Link } from '@/lib/navigation'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { ContentPageContent } from '@/types/site-content'
import { GuideArticleBlock } from '@/components/site/content/guide-article/GuideArticleBlocks'
import { GuideArticleHero } from '@/components/site/content/guide-article/GuideArticleHero'
import {
  GUIDE_ARTICLE_LAYOUT,
  parseGuideSubtitle,
} from '@/components/site/content/guide-article/guide-article-utils'
import { Reveal } from '@/components/motion'
import { SITE_PAGE_X_CLASS } from '@/styles/site-ui'
import { cn } from '@/utils/cn'

type Props = {
  content: ContentPageContent
  breadcrumb?: Array<{ label: string; to?: string }>
}

export function GuideArticlePageView({ content, breadcrumb }: Props) {
  const { t } = useI18n()
  const lp = useLocalePath()
  const { headline, description } = parseGuideSubtitle(content.subtitle)
  const crumbs = breadcrumb ?? [{ label: 'Guide', to: '/guide' }, { label: content.title }]
  const currentCrumb = crumbs[crumbs.length - 1]?.label ?? content.title
  const pageCta = content.cta

  return (
    <article className="bg-idl-paper">
      <GuideArticleHero
        title={content.title}
        eyebrow={content.eyebrow}
        coverImageUrl={content.coverImage?.imageUrl}
        coverAlt={content.coverImage?.alt ?? content.title}
      />

      <div className="border-b border-[#e4e4e7] bg-idl-paper">
        <div
          className={cn(
            GUIDE_ARTICLE_LAYOUT.wide,
            SITE_PAGE_X_CLASS,
            'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between',
          )}
        >
          <nav aria-label={t('breadcrumb.nav')} className="font-mono text-[11.5px] text-[#8c8273]">
            <Link to={lp('/')} className="transition hover:text-idl-ink">
              {t('breadcrumb.home')}
            </Link>
            {crumbs.map((item, index) => (
              <span key={`${item.label}-${index}`}>
                {' · '}
                {item.to && index < crumbs.length - 1 ? (
                  <Link to={lp(item.to)} className="transition hover:text-idl-ink">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-idl-ink">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
          <Link
            to={lp('/guide')}
            className="shrink-0 text-[13px] font-bold text-idl-brass no-underline transition hover:text-idl-brass-light"
          >
            ← {t('common.back')}
          </Link>
        </div>
      </div>

      {headline || description || content.intro ? (
        <Reveal immediate>
          <section className={cn(GUIDE_ARTICLE_LAYOUT.intro, SITE_PAGE_X_CLASS, 'py-10 sm:py-11')}>
            {headline ? (
              <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.375rem)] font-medium italic leading-[1.06] tracking-tight text-idl-ink">
                {headline}
              </h2>
            ) : null}
            {description ? (
              <p className={cn('text-[17px] leading-[1.55] text-[#6b6157]', headline ? 'mt-3' : undefined)}>
                {description}
              </p>
            ) : null}
            {content.intro ? (
              <div className="mt-6 rounded-lg border border-[#e4e4e7] border-l-[3px] border-l-idl-brass bg-white px-5 py-[18px]">
                <p className="mb-2 font-mono text-[10px] tracking-[0.14em] text-idl-brass uppercase">
                  Risposta breve
                </p>
                <p className="text-[14.5px] leading-[1.6] text-[#3f3a32]">{content.intro}</p>
              </div>
            ) : null}
          </section>
        </Reveal>
      ) : null}

      <div className="pb-4">
        {content.blocks.map((block, index) => (
          <Reveal key={`${block.kind}-${index}`}>
            <GuideArticleBlock block={block} lp={lp} />
          </Reveal>
        ))}
      </div>

      <section className={cn(GUIDE_ARTICLE_LAYOUT.wide, SITE_PAGE_X_CLASS, 'flex flex-col gap-3 py-7 sm:flex-row sm:items-center sm:justify-between sm:py-8')}>
        <Link
          to={lp('/guide')}
          className="text-[13.5px] font-bold text-idl-brass no-underline transition hover:text-idl-brass-light"
        >
          ← Torna alle guide
        </Link>
        {pageCta ? (
          <Link
            to={lp(pageCta.href)}
            className="text-[13.5px] font-bold text-idl-brass no-underline transition hover:text-idl-brass-light"
          >
            {pageCta.label} →
          </Link>
        ) : (
          <span className="text-[13.5px] font-bold text-idl-brass">{currentCrumb}</span>
        )}
      </section>
    </article>
  )
}
