'use client'

import { useEffect, useLayoutEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { fetchSitePage, hydrateSitePageContent, siteStore } from '@/features/site'
import { isEditorialPage } from '@/lib/site-page-keys'
import { AmbientiView } from '@/components/site/ambienti'
import { useLocale } from '@/context/locale-context'
import { ErrorState } from '@/components/ErrorState'
import { ToastOnError } from '@/components/ToastFeedback'
import type { EditorialPageContent } from '@/types/site-content'

type Props = {
  initialContent?: EditorialPageContent | null
}

export function AmbientiPage({ initialContent = null }: Props) {
  const { locale } = useLocale()
  const snap = useSnapshot(siteStore)
  const raw = snap.pages.ambienti ?? initialContent
  const loading = !raw && Boolean(snap.loading.ambienti)

  useLayoutEffect(() => {
    if (initialContent && isEditorialPage(initialContent)) {
      hydrateSitePageContent('ambienti', locale, initialContent)
    }
  }, [initialContent, locale])

  useEffect(() => {
    void fetchSitePage('ambienti', locale, { skipIfFresh: true })
  }, [locale])

  if (snap.error && !raw) {
    return (
      <>
        <ToastOnError message={snap.error} />
        <div className="mx-auto max-w-lg p-8 text-center text-sm text-idl-muted">{snap.error}</div>
      </>
    )
  }

  if (raw && !isEditorialPage(raw)) {
    return <ErrorState message="Contenuto pagina non valido" className="mx-auto max-w-lg p-8" />
  }

  const content =
    raw && isEditorialPage(raw) ? (raw as EditorialPageContent) : null

  return (
    <AmbientiView content={content} roomsLoading={!content && loading} />
  )
}
