'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { fetchSitePage, siteStore } from '@/features/site'
import { fetchProductsByQuery } from '@/features/catalog'
import { HomeView } from '@/components/site/home/HomeView'
import { useLocale } from '@/context/locale-context'
import { ToastOnError } from '@/components/ToastFeedback'
import { SeoHead } from '@/components/SeoHead'
import { useI18n } from '@/hooks/use-i18n'
import { isHomePageContent } from '@/lib/site-page-keys'
import type { HomePageContent } from '@/types/site-content'
import type { ProductCardDTO } from '@/types/dto'
import { HomePageSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'

type Props = {
  initialContent?: HomePageContent | null
}

export function HomePage({ initialContent = null }: Props) {
  const { locale } = useLocale()
  const { t } = useI18n()
  const snap = useSnapshot(siteStore)
  const raw = snap.pages.home ?? initialContent
  const [designProducts, setDesignProducts] = useState<ProductCardDTO[]>([])
  const [technicalProducts, setTechnicalProducts] = useState<ProductCardDTO[]>([])

  const content = useMemo(() => {
    if (!raw || !isHomePageContent(raw)) return null
    return raw as HomePageContent
  }, [raw])

  useEffect(() => {
    if (initialContent && !siteStore.pages.home) {
      siteStore.pages.home = initialContent
    }
  }, [initialContent])

  useEffect(() => {
    void fetchSitePage('home', locale)
  }, [locale])

  useEffect(() => {
    if (!content) return

    const designQuery = content.designShowcase.searchQuery?.trim()
    const technicalQuery = content.technicalShowcase.searchQuery?.trim()

    void Promise.all([
      designQuery
        ? fetchProductsByQuery(designQuery, {
            pageSize: content.designShowcase.productCount,
            locale,
          })
        : Promise.resolve([]),
      technicalQuery
        ? fetchProductsByQuery(technicalQuery, {
            pageSize: content.technicalShowcase.productCount,
            locale,
          })
        : Promise.resolve([]),
    ]).then(([design, technical]) => {
      setDesignProducts(design)
      setTechnicalProducts(technical)
    })
  }, [content, locale])

  if (snap.error && !content) {
    return (
      <>
        <ToastOnError message={snap.error} />
        <div className="mx-auto max-w-lg p-8 text-center text-sm text-idl-muted">{snap.error}</div>
      </>
    )
  }

  return (
    <PageLoadTransition isLoading={!content} skeleton={<HomePageSkeleton />}>
      {content ? (
        <>
          <SeoHead title={`${t('home.title')} — ${t('home.subtitle')}`} description={t('home.subtitle')} />
          <HomeView content={content} designProducts={designProducts} technicalProducts={technicalProducts} />
        </>
      ) : null}
    </PageLoadTransition>
  )
}
