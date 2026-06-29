'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { fetchSitePage, seedSitePageContent, siteStore } from '@/features/site'
import { fetchProductsByQuery } from '@/features/catalog'
import { api } from '@/api/endpoints'
import { HomeView } from '@/components/site/home/HomeView'
import { useLocale } from '@/context/locale-context'
import { ToastOnError } from '@/components/ToastFeedback'
import { isHomePageContent } from '@/lib/site-page-keys'
import { resolveHomeBrandCards } from '@/lib/brand.defaults'
import type { BrandListItemDTO, HomePageContent } from '@/types/site-content'
import type { ProductCardDTO } from '@/types/dto'
import { HomePageSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'

type Props = {
  initialContent?: HomePageContent | null
}

export function HomePage({ initialContent = null }: Props) {
  const { locale } = useLocale()
  const snap = useSnapshot(siteStore)
  const [designProducts, setDesignProducts] = useState<ProductCardDTO[]>([])
  const [technicalProducts, setTechnicalProducts] = useState<ProductCardDTO[]>([])
  const [featuredGuides, setFeaturedGuides] = useState<
    Array<{ category: string; title: string; meta: string; href: string }>
  >([])
  const [hubBrands, setHubBrands] = useState<BrandListItemDTO[]>([])

  const showcaseSource = useMemo((): HomePageContent | null => {
    const raw = snap.pages.home ?? initialContent
    if (!raw || !isHomePageContent(raw)) return null
    return raw as HomePageContent
  }, [snap.pages.home, initialContent])

  const content = showcaseSource

  const homeBrands = useMemo(() => {
    if (!content) return []
    return resolveHomeBrandCards(content.brands.items, hubBrands)
  }, [content, hubBrands])

  const viewContent = useMemo(() => {
    if (!content) return null
    if (featuredGuides.length === 0) return content
    return {
      ...content,
      guides: {
        ...content.guides,
        items: featuredGuides.map((guide) => ({
          category: guide.category,
          title: guide.title,
          meta: guide.meta,
          href: guide.href,
        })),
      },
    }
  }, [content, featuredGuides])

  useEffect(() => {
    if (initialContent) {
      seedSitePageContent('home', locale, initialContent)
    }
  }, [initialContent, locale])

  useEffect(() => {
    void fetchSitePage('home', locale, { skipIfFresh: true })
    void api.site
      .guides(locale, { featured: true })
      .then((items) =>
        setFeaturedGuides(
          items.map((guide) => ({
            category: guide.category,
            title: guide.title,
            meta: guide.meta,
            href: guide.href,
          })),
        ),
      )
      .catch(() => setFeaturedGuides([]))
    void api.catalog
      .brands()
      .then((data) => setHubBrands(data.items))
      .catch(() => setHubBrands([]))
  }, [locale])

  useEffect(() => {
    if (!showcaseSource) return

    const designQuery = showcaseSource.designShowcase.searchQuery?.trim()
    const technicalQuery = showcaseSource.technicalShowcase.searchQuery?.trim()

    void Promise.all([
      designQuery
        ? fetchProductsByQuery(designQuery, {
            pageSize: showcaseSource.designShowcase.productCount,
            locale,
          })
        : Promise.resolve([]),
      technicalQuery
        ? fetchProductsByQuery(technicalQuery, {
            pageSize: showcaseSource.technicalShowcase.productCount,
            locale,
          })
        : Promise.resolve([]),
    ]).then(([design, technical]) => {
      setDesignProducts(design)
      setTechnicalProducts(technical)
    })
  }, [showcaseSource, locale])

  if (snap.error && !viewContent) {
    return (
      <>
        <ToastOnError message={snap.error} />
        <div className="mx-auto max-w-lg p-8 text-center text-sm text-idl-muted">{snap.error}</div>
      </>
    )
  }

  return (
    <PageLoadTransition isLoading={!viewContent} skeleton={<HomePageSkeleton />}>
      {viewContent ? (
        <HomeView
          content={viewContent}
          designProducts={designProducts}
          technicalProducts={technicalProducts}
          homeBrands={homeBrands}
        />
      ) : null}
    </PageLoadTransition>
  )
}
