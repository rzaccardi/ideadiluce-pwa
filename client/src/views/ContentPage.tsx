'use client'

import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { fetchSitePage, siteStore } from '@/features/site'
import type { ContentPageContent, SitePageKey } from '@/types/site-content'
import { isContentPage } from '@/lib/site-page-keys'
import { ContentPageView } from '@/components/site/content/ContentPageView'
import { useLocale } from '@/context/locale-context'
import { ErrorState } from '@/components/ErrorState'
import { ToastOnError } from '@/components/ToastFeedback'
import { SeoHead } from '@/components/SeoHead'
import { ContentPageSkeleton } from '@/components/Skeleton'
import { PageHeader } from '@/components/PageHeader'
import { PageLoadTransition } from '@/components/motion'
import { getPageHeaderFallbackTitle } from '@/lib/page-header-fallbacks'

type Props = {
  pageKey: SitePageKey
  breadcrumb?: Array<{ label: string; to?: string }>
}

export function ContentPage({ pageKey, breadcrumb }: Props) {
  const { locale } = useLocale()
  const snap = useSnapshot(siteStore)
  const raw = snap.pages[pageKey]

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

  return (
    <PageLoadTransition
      isLoading={!content}
      skeleton={<ContentPageSkeleton />}
      loadingHeader={
        fallbackTitle ? <PageHeader title={fallbackTitle} /> : null
      }
    >
      {content ? (
        <>
          <SeoHead
            title={`${content.title} | Idea di Luce`}
            description={content.subtitle ?? content.intro}
            noindex={content.seo?.noindex}
          />
          <ContentPageView content={content} breadcrumb={breadcrumb} />
        </>
      ) : null}
    </PageLoadTransition>
  )
}
