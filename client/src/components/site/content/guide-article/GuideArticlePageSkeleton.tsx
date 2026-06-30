'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { useI18n } from '@/hooks/use-i18n'
import { GUIDE_ARTICLE_LAYOUT } from '@/components/site/content/guide-article/guide-article-utils'
import { SITE_PAGE_X_CLASS } from '@/styles/site-ui'
import { cn } from '@/utils/cn'

export function GuideArticlePageSkeleton() {
  const { t } = useI18n()

  return (
    <article className="bg-idl-paper" role="status" aria-label={t('skeleton.loadingPageHeader')}>
      <header className="relative overflow-hidden bg-idl-design">
        <Skeleton className="h-[280px] rounded-none bg-idl-graphite-2 sm:h-[340px] lg:h-[480px]" />
        <div className="absolute inset-x-0 bottom-0">
          <div className={cn(GUIDE_ARTICLE_LAYOUT.wide, SITE_PAGE_X_CLASS, 'pb-8 pt-6 sm:pb-10')}>
            <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-3.5">
              <Skeleton className="h-6 w-24 rounded-idl-pill bg-idl-graphite-2" />
              <Skeleton className="h-3.5 w-28 bg-idl-graphite-2" />
            </div>
            <Skeleton className="h-12 w-full max-w-[780px] bg-idl-graphite-2 sm:h-16 lg:h-[3.25rem]" />
          </div>
        </div>
      </header>

      <div className="border-b border-[#e6dcc9] bg-idl-paper">
        <div
          className={cn(
            GUIDE_ARTICLE_LAYOUT.wide,
            SITE_PAGE_X_CLASS,
            'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between',
          )}
        >
          <Skeleton className="h-3 w-52" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <section className={cn(GUIDE_ARTICLE_LAYOUT.intro, SITE_PAGE_X_CLASS, 'py-10 sm:py-11')}>
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
        <div className="mt-6 rounded-lg border border-[#e6dcc9] border-l-[3px] border-l-idl-brass bg-white px-5 py-[18px]">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
        </div>
      </section>

      <div className="pb-4">
        <section className={cn(GUIDE_ARTICLE_LAYOUT.body, SITE_PAGE_X_CLASS, 'py-5 sm:py-6')}>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </section>
        <section className={cn(GUIDE_ARTICLE_LAYOUT.body, SITE_PAGE_X_CLASS, 'py-5 sm:py-6')}>
          <Skeleton className="aspect-[16/10] w-full rounded" />
        </section>
        <section className={cn(GUIDE_ARTICLE_LAYOUT.body, SITE_PAGE_X_CLASS, 'py-5 sm:py-6')}>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </section>
      </div>

      <section
        className={cn(
          GUIDE_ARTICLE_LAYOUT.wide,
          SITE_PAGE_X_CLASS,
          'flex flex-col gap-3 py-7 sm:flex-row sm:items-center sm:justify-between sm:py-8',
        )}
      >
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-32" />
      </section>
    </article>
  )
}
