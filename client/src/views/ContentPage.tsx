'use client'

import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { fetchSitePage, seedSitePageContent, siteStore } from '@/features/site'
import type { ContentPageContent, SitePageKey } from '@/types/site-content'
import { isContentPage, isGuidePageKey } from '@/lib/site-page-keys'
import { ContentPageView } from '@/components/site/content/ContentPageView'
import { ContattiPageView } from '@/components/site/content/ContattiPageView'
import { ProductNotFoundPageView } from '@/components/site/product-not-found/ProductNotFoundPageView'
import { GuideArticlePageView } from '@/components/site/content/GuideArticlePageView'
import { useLocale } from '@/context/locale-context'
import { ErrorState } from '@/components/ErrorState'
import { ToastOnError } from '@/components/ToastFeedback'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { ContentPageSkeleton } from '@/components/Skeleton'
import { PageHeader } from '@/components/PageHeader'
import { SectionContainer } from '@/components/site/primitives'
import { PageLoadTransition } from '@/components/motion'
import { getPageHeaderFallbackTitle } from '@/lib/page-header-fallbacks'

type Props = {
  pageKey: SitePageKey
  breadcrumb?: Array<{ label: string; to?: string }>
  initialContent?: ContentPageContent | null
}

export function ContentPage({ pageKey, breadcrumb, initialContent = null }: Props) {
  const { locale } = useLocale()
  const snap = useSnapshot(siteStore)
  const raw = snap.pages[pageKey] ?? initialContent

  useEffect(() => {
    if (initialContent && !siteStore.pages[pageKey]) {
      seedSitePageContent(pageKey, locale, initialContent)
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

  const fallbackTitle = getPageHeaderFallbackTitle(pageKey)
  const isGuideArticle = isGuidePageKey(pageKey)

  if (pageKey === 'contatti') {
    return (
      <PageLoadTransition
        isLoading={!content}
        skeleton={<ContentPageSkeleton />}
        loadingHeader={
          fallbackTitle ? <PageHeader title={fallbackTitle} /> : null
        }
      >
        {content ? <ContattiPageView content={content} /> : null}
      </PageLoadTransition>
    )
  }

  if (pageKey === 'prodotto-non-trovato') {
    return (
      <PageLoadTransition
        isLoading={!content}
        skeleton={<ContentPageSkeleton />}
        loadingHeader={
          fallbackTitle ? <PageHeader title={fallbackTitle} /> : null
        }
      >
        {content ? <ProductNotFoundPageView content={content} /> : null}
      </PageLoadTransition>
    )
  }

  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <SectionContainer className="py-8 sm:py-10">
          <PageLoadTransition
            isLoading={!content}
            skeleton={<ContentPageSkeleton />}
            loadingHeader={
              fallbackTitle ? <PageHeader title={fallbackTitle} /> : null
            }
          >
            {content ? (
              isGuideArticle ? (
                <GuideArticlePageView content={content} breadcrumb={breadcrumb} />
              ) : (
                <ContentPageView content={content} breadcrumb={breadcrumb} />
              )
            ) : null}
          </PageLoadTransition>
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
