'use client'

import Image from 'next/image'
import { GUIDE_ARTICLE_LAYOUT, parseGuideEyebrow } from '@/components/site/content/guide-article/guide-article-utils'
import { SITE_PAGE_X_CLASS } from '@/styles/site-ui'
import { cn } from '@/utils/cn'

type Props = {
  title: string
  eyebrow?: string
  coverImageUrl?: string
  coverAlt?: string
}

export function GuideArticleHero({ title, eyebrow, coverImageUrl, coverAlt }: Props) {
  const { category, meta } = parseGuideEyebrow(eyebrow)

  return (
    <header className="relative overflow-hidden bg-idl-design">
      <div className="relative h-[280px] sm:h-[340px] lg:h-[480px]">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={coverAlt ?? title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-idl-design via-[#2a2a2e] to-idl-design" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-b from-idl-design/10 via-idl-design/20 to-idl-design/70"
          aria-hidden
        />
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <div className={cn(GUIDE_ARTICLE_LAYOUT.wide, SITE_PAGE_X_CLASS, 'pb-8 pt-6 sm:pb-10')}>
          {category || meta ? (
            <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-3.5">
              {category ? (
                <span className="rounded-idl-pill bg-idl-glow px-3 py-1 font-mono text-[10.5px] font-medium tracking-[0.12em] text-idl-design uppercase">
                  {category}
                </span>
              ) : null}
              {meta ? (
                <span className="font-mono text-[11px] tracking-[0.06em] text-[#a1a1aa]">{meta}</span>
              ) : null}
            </div>
          ) : null}
          <h1 className="max-w-[780px] font-serif text-[clamp(1.7rem,4.5vw,3.25rem)] font-medium leading-[1.04] tracking-tight text-white">
            {title}
          </h1>
        </div>
      </div>
    </header>
  )
}
