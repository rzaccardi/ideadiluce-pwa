'use client'

import { useEffect, useMemo } from 'react'
import { useSnapshot } from 'valtio/react'
import { fetchSitePage, siteStore } from '@/features/site'
import { useLocale } from '@/context/locale-context'
import { isProfessionistiPageContent } from '@/lib/site-page-keys'
import type { ProfessionistiPageContent } from '@/types/site-content'
import { ProfessionistiPageView } from '@/components/site/professionisti/ProfessionistiPageView'
import { ErrorState } from '@/components/ErrorState'
import { ToastOnError } from '@/components/ToastFeedback'
import { ProfessionistiPageSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'

type Props = {
  initialContent?: ProfessionistiPageContent | null
}

export function ProfessionistiPage({ initialContent = null }: Props) {
  const { locale } = useLocale()
  const snap = useSnapshot(siteStore)
  const raw = snap.pages.professionisti ?? initialContent

  const content = useMemo(() => {
    if (!raw || !isProfessionistiPageContent(raw)) return null
    return raw as ProfessionistiPageContent
  }, [raw])

  useEffect(() => {
    if (initialContent && !siteStore.pages.professionisti) {
      siteStore.pages.professionisti = initialContent
    }
  }, [initialContent])

  useEffect(() => {
    void fetchSitePage('professionisti', locale)
  }, [locale])

  if (snap.error && !content) {
    return (
      <>
        <ToastOnError message={snap.error} />
        <div className="mx-auto max-w-lg p-8 text-center text-sm text-idl-muted">{snap.error}</div>
      </>
    )
  }

  if (raw && !isProfessionistiPageContent(raw)) {
    return <ErrorState message="Contenuto pagina non valido" className="mx-auto max-w-lg p-8" />
  }

  return (
    <PageLoadTransition
      isLoading={!content}
      skeleton={<ProfessionistiPageSkeleton />}
    >
      {content ? <ProfessionistiPageView content={content} /> : null}
    </PageLoadTransition>
  )
}
