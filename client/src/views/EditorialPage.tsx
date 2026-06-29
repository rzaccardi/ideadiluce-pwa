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
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { EditorialPageSkeleton } from '@/components/Skeleton'
import { PageHeader } from '@/components/PageHeader'
import { SectionContainer } from '@/components/site/primitives'
import { PageLoadTransition } from '@/components/motion'
import { getPageHeaderFallbackTitle } from '@/lib/page-header-fallbacks'

type EditorialKey = Extract<SitePageKey, 'attacco' | 'ambienti' | 'brand' | 'guide'>

function mergeGuideHubContent(
  cms: EditorialPageContent,
  indexed: Array<{ title: string; href: string; meta: string; category: string }>,
): EditorialPageContent {
  if (indexed.length === 0) return { ...cms, items: [...cms.items] }
  return {
    ...cms,
    items: indexed.map((guide) => ({
      title: guide.title,
      href: guide.href,
      meta: guide.meta,
      category: guide.category,
    })),
  }
}

function mergeBrandContent(
  cms: EditorialPageContent | Readonly<EditorialPageContent>,
  hubBrands: BrandListItemDTO[],
): EditorialPageContent {
  const base = cms as EditorialPageContent
  if (hubBrands.length === 0) return { ...base, items: [...base.items] }
  const seen = new Set<string>()
  const hubItems = hubBrands.map((brand) => ({
    title: brand.name,
    href: `/negozio?brand=${encodeURIComponent(brand.slug)}`,
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
  const [indexedGuides, setIndexedGuides] = useState<
    Array<{ title: string; href: string; meta: string; category: string }>
  >([])

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

  useEffect(() => {
    if (pageKey !== 'guide') return
    void api.site
      .guides(locale)
      .then((items) => setIndexedGuides(items))
      .catch(() => setIndexedGuides([]))
  }, [pageKey, locale])

  const viewContent = useMemo(() => {
    if (!raw || !isEditorialPage(raw)) return null
    const content = raw as EditorialPageContent
    if (pageKey === 'brand') return mergeBrandContent(content, hubBrands)
    if (pageKey === 'guide') return mergeGuideHubContent(content, indexedGuides)
    return content
  }, [raw, hubBrands, indexedGuides, pageKey])

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
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <SectionContainer className="py-8 sm:py-10">
          <PageLoadTransition
            isLoading={!viewContent}
            skeleton={<EditorialPageSkeleton />}
            loadingHeader={
              fallbackTitle ? <PageHeader title={fallbackTitle} /> : null
            }
          >
            {viewContent ? (
              <EditorialPageView pageKey={pageKey} content={viewContent} />
            ) : null}
          </PageLoadTransition>
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
