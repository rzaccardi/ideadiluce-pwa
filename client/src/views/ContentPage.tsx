'use client'

import { useEffect, useLayoutEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { fetchSitePage, hydrateSitePageContent, siteStore } from '@/features/site'
import type { ContentPageContent, SitePageKey } from '@/types/site-content'
import { isContentPage, isGuidePageKey } from '@/lib/site-page-keys'
import { ContentPageView } from '@/components/site/content/ContentPageView'
import { ContattiPageView } from '@/components/site/content/ContattiPageView'
import { ChiSiamoPageView } from '@/components/site/content/ChiSiamoPageView'
import { ProductNotFoundPageView } from '@/components/site/product-not-found/ProductNotFoundPageView'
import { GuideArticlePageView } from '@/components/site/content/GuideArticlePageView'
import { useLocale } from '@/context/locale-context'
import { ErrorState } from '@/components/ErrorState'
import { ToastOnError } from '@/components/ToastFeedback'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { ContentPageSkeleton } from '@/components/Skeleton'
import { GuideArticlePageSkeleton } from '@/components/site/content/guide-article/GuideArticlePageSkeleton'
import { SectionContainer } from '@/components/site/primitives'
import { PageLoadTransition } from '@/components/motion'

type Props = {
  pageKey: SitePageKey
  breadcrumb?: Array<{ label: string; to?: string }>
  initialContent?: ContentPageContent | null
}

export function ContentPage({ pageKey, breadcrumb, initialContent = null }: Props) {
  const { locale } = useLocale()
  const snap = useSnapshot(siteStore)
  const raw = snap.pages[pageKey] ?? initialContent

  useLayoutEffect(() => {
    if (initialContent) {
      hydrateSitePageContent(pageKey, locale, initialContent)
    }
  }, [initialContent, pageKey, locale])

  useEffect(() => {
    void fetchSitePage(pageKey, locale, { skipIfFresh: true })
  }, [pageKey, locale])

  const content =
    raw && isContentPage(raw) ? (raw as ContentPageContent) : null

  if (snap.error && !content) {
    return (
      <>
        <ToastOnError message={snap.error} />
        <div className="mx-auto max-w-lg p-8 text-center text-sm text-idl-muted">{snap.error}</div>
      </>
    )
  }

  if (raw && !isContentPage(raw)) {
    return <ErrorState message="Contenuto pagina non valido" className="mx-auto max-w-lg p-8" />
  }

  const isGuideArticle = isGuidePageKey(pageKey)

  if (pageKey === 'contatti') {
    return (
      <PageLoadTransition
        isLoading={!content}
        skeleton={<ContentPageSkeleton />}
      >
        {content ? <ContattiPageView content={content} /> : null}
      </PageLoadTransition>
    )
  }

  if (pageKey === 'chi-siamo') {
    return (
      <PageLoadTransition
        isLoading={!content}
        skeleton={<ContentPageSkeleton />}
      >
        {content ? <ChiSiamoPageView content={content} /> : null}
      </PageLoadTransition>
    )
  }

  if (pageKey === 'prodotto-non-trovato') {
    return (
      <PageLoadTransition
        isLoading={!content}
        skeleton={<ContentPageSkeleton />}
      >
        {content ? <ProductNotFoundPageView content={content} /> : null}
      </PageLoadTransition>
    )
  }

  if (isGuideArticle) {
    return (
      <PageFlexShell tone="paper">
        <PageFlexBody tone="paper">
          <PageLoadTransition isLoading={!content} skeleton={<GuideArticlePageSkeleton />}>
            {content ? <GuideArticlePageView content={content} breadcrumb={breadcrumb} /> : null}
          </PageLoadTransition>
        </PageFlexBody>
      </PageFlexShell>
    )
  }

  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <SectionContainer className="py-8 sm:py-10">
          <PageLoadTransition
            isLoading={!content}
            skeleton={<ContentPageSkeleton />}
          >
            {content ? <ContentPageView content={content} breadcrumb={breadcrumb} /> : null}
          </PageLoadTransition>
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
