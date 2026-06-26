'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { api } from '@/api/endpoints'
import { fetchSitePage, siteStore } from '@/features/site'
import type { BrandListItemDTO, EditorialPageContent, SitePageKey } from '@/types/site-content'
import { isEditorialPage } from '@/lib/site-page-keys'
import { EditorialPageView } from '@/components/site/editorial/EditorialPageView'
import { useLocale } from '@/context/locale-context'
import { ErrorState } from '@/components/ErrorState'
import { ToastOnError } from '@/components/ToastFeedback'
import { SeoHead } from '@/components/SeoHead'
import { EditorialPageSkeleton } from '@/components/Skeleton'
import { PageHeader } from '@/components/PageHeader'
import { PageLoadTransition } from '@/components/motion'
import { getPageHeaderFallbackTitle } from '@/lib/page-header-fallbacks'

type EditorialKey = Extract<SitePageKey, 'attacco' | 'ambienti' | 'brand' | 'guide'>

function mergeBrandContent(
  cms: EditorialPageContent | Readonly<EditorialPageContent>,
  hubBrands: BrandListItemDTO[],
): EditorialPageContent {
  const base = cms as EditorialPageContent
  if (hubBrands.length === 0) return { ...base, items: [...base.items] }
  const seen = new Set<string>()
  const hubItems = hubBrands.map((brand) => ({
    title: brand.name,
    href: `/catalog?brand=${encodeURIComponent(brand.slug)}`,
    meta: (brand.productCount ?? 0) > 0 ? `${brand.productCount} prodotti` : undefined,
  }))
  const cmsItems = [...base.items].filter((item) => {
    if (seen.has(item.title.toLowerCase())) return false
    seen.add(item.title.toLowerCase())
    return true
  })
  for (const item of hubItems) {
    if (seen.has(item.title.toLowerCase())) continue
    seen.add(item.title.toLowerCase())
    cmsItems.push(item)
  }
  return { ...base, items: cmsItems }
}

export function EditorialPage({ pageKey }: { pageKey: EditorialKey }) {
  const { locale } = useLocale()
  const snap = useSnapshot(siteStore)
  const raw = snap.pages[pageKey]
  const [hubBrands, setHubBrands] = useState<BrandListItemDTO[]>([])

  useEffect(() => {
    void fetchSitePage(pageKey, locale)
  }, [pageKey, locale])

  useEffect(() => {
    if (pageKey !== 'brand') return
    void api.catalog
      .brands()
      .then((data) => setHubBrands(data.items))
      .catch(() => setHubBrands([]))
  }, [pageKey])

  const viewContent = useMemo(() => {
    if (!raw || !isEditorialPage(raw)) return null
    const content = raw as EditorialPageContent
    if (pageKey === 'brand') return mergeBrandContent(content, hubBrands)
    return content
  }, [raw, hubBrands, pageKey])

  if (snap.error && !viewContent) {
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

  const fallbackTitle = getPageHeaderFallbackTitle(pageKey)

  return (
    <PageLoadTransition
      isLoading={!viewContent}
      skeleton={<EditorialPageSkeleton />}
      loadingHeader={
        fallbackTitle ? <PageHeader title={fallbackTitle} /> : null
      }
    >
      {viewContent ? (
        <>
          <SeoHead
            title={`${viewContent.title} | Idea di Luce`}
            description={viewContent.subtitle ?? viewContent.intro}
          />
          <EditorialPageView pageKey={pageKey} content={viewContent} />
        </>
      ) : null}
    </PageLoadTransition>
  )
}
