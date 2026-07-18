'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { fetchSitePage, hydrateSitePageContent, siteStore } from '@/features/site'
import { fetchProductsByQuery } from '@/features/catalog'
import { api } from '@/api/endpoints'
import { HomeView2 } from '@/components/site/home2/HomeView2'
import { useLocale } from '@/context/locale-context'
import { ToastOnError } from '@/components/ToastFeedback'
import { isHomePageContent } from '@/lib/site-page-keys'
import { resolveHomeBrandCards } from '@/lib/brand.defaults'
import type { BrandListItemDTO, HomePageContent } from '@/types/site-content'
import type { HomeProductSliderDTO } from '@/types/home-product-sliders'
import type { ProductCardDTO } from '@/types/dto'
import {
  readHomeProductSlidersClientCache,
  writeHomeProductSlidersClientCache,
} from '@/lib/home-product-sliders-cache'
import { HOME_SLIDER_PRODUCT_COUNT, resolveShowcaseProducts } from '@/lib/home-product-sliders'
import { CATALOG_DESIGN_CATEGORY_SLUG } from '@/lib/catalog-filters'
import { HomePageSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'

type Props = {
  initialContent?: HomePageContent | null
  initialProductSliders?: HomeProductSliderDTO[] | null
  initialBrands?: BrandListItemDTO[]
  initialFeaturedGuides?: Array<{ category: string; title: string; meta: string; href: string }>
}

export function HomePage2({
  initialContent = null,
  initialProductSliders = null,
  initialBrands = [],
  initialFeaturedGuides = [],
}: Props) {
  const { locale } = useLocale()
  const snap = useSnapshot(siteStore)
  const [productSliders, setProductSliders] = useState<HomeProductSliderDTO[]>(
    initialProductSliders ?? [],
  )
  const [queryDesignProducts, setQueryDesignProducts] = useState<ProductCardDTO[]>([])
  const [featuredGuides, setFeaturedGuides] = useState(initialFeaturedGuides)
  const [hubBrands, setHubBrands] = useState<BrandListItemDTO[]>(initialBrands)

  const cmsContent = useMemo((): HomePageContent | null => {
    const raw = snap.pages.home ?? initialContent
    if (!raw || !isHomePageContent(raw)) return null
    return raw as HomePageContent
  }, [snap.pages.home, initialContent])

  const designProducts = useMemo(
    () => resolveShowcaseProducts(productSliders, 'top-design', queryDesignProducts),
    [productSliders, queryDesignProducts],
  )

  const homeBrands = useMemo(() => {
    if (!cmsContent) return []
    return resolveHomeBrandCards(cmsContent.brands.items, hubBrands)
  }, [cmsContent, hubBrands])

  const guidesSection = useMemo(() => {
    if (!cmsContent) return null
    if (!featuredGuides.length) return cmsContent.guides
    return {
      ...cmsContent.guides,
      items: featuredGuides.map((guide) => ({
        category: guide.category,
        title: guide.title,
        meta: guide.meta,
        href: guide.href,
      })),
    }
  }, [cmsContent, featuredGuides])

  useLayoutEffect(() => {
    if (initialContent) hydrateSitePageContent('home', locale, initialContent)
  }, [initialContent, locale])

  useEffect(() => {
    void fetchSitePage('home', locale, { skipIfFresh: true })

    if (!initialFeaturedGuides.length) {
      void api.site
        .guides(locale, { featured: true })
        .then((items) => setFeaturedGuides(items))
        .catch(() => setFeaturedGuides([]))
    }

    if (!initialBrands.length) {
      void api.catalog.brands().then((data) => setHubBrands(data.items)).catch(() => setHubBrands([]))
    }

    if (initialProductSliders?.length) return

    const cached = readHomeProductSlidersClientCache(locale)
    if (cached?.length) {
      setProductSliders(cached)
      return
    }

    void api.catalog
      .homeProductSliders(locale)
      .then((data) => {
        writeHomeProductSlidersClientCache(locale, data)
        setProductSliders(data)
      })
      .catch(() => setProductSliders([]))
  }, [locale, initialProductSliders, initialBrands.length, initialFeaturedGuides.length])

  useEffect(() => {
    if (!cmsContent) return
    const fromSlider = productSliders.find((s) => s.key === 'top-design')?.products ?? []
    if (fromSlider.length > 0) return

    const designQuery = cmsContent.designShowcase.searchQuery?.trim() ?? ''
    void fetchProductsByQuery(designQuery, {
      pageSize: Math.max(cmsContent.designShowcase.productCount, HOME_SLIDER_PRODUCT_COUNT, 12),
      locale,
      category: CATALOG_DESIGN_CATEGORY_SLUG,
    })
      .then(setQueryDesignProducts)
      .catch(() => setQueryDesignProducts([]))
  }, [cmsContent, locale, productSliders])

  if (snap.error && !cmsContent) {
    return (
      <>
        <ToastOnError message={snap.error} />
        <div className="mx-auto max-w-lg p-8 text-center text-sm text-idl-muted">{snap.error}</div>
      </>
    )
  }

  return (
    <PageLoadTransition isLoading={!cmsContent || !guidesSection} skeleton={<HomePageSkeleton />}>
      {cmsContent && guidesSection ? (
        <HomeView2
          cmsContent={cmsContent}
          designProducts={designProducts}
          homeBrands={homeBrands}
          featuredGuides={guidesSection}
        />
      ) : null}
    </PageLoadTransition>
  )
}
