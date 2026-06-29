'use client'

import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { fetchSitePage, siteStore } from '@/features/site'
import { isEditorialPage } from '@/lib/site-page-keys'
import { AmbientiView } from '@/components/site/ambienti'
import { useLocale } from '@/context/locale-context'
import { ErrorState } from '@/components/ErrorState'
import { ToastOnError } from '@/components/ToastFeedback'
import type { EditorialPageContent } from '@/types/site-content'

export function AmbientiPage() {
  const { locale } = useLocale()
  const snap = useSnapshot(siteStore)
  const raw = snap.pages.ambienti
  const loading = !raw && Boolean(snap.loading.ambienti)

  useEffect(() => {
    void fetchSitePage('ambienti', locale)
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
