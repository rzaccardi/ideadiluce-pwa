'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { fetchSitePage, hydrateSitePageContent, siteStore } from '@/features/site'
import { fetchProductsByQuery } from '@/features/catalog'
import { api } from '@/api/endpoints'
import { HomeView } from '@/components/site/home/HomeView'
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
import { extraHomeProductSliders, HOME_SLIDER_PRODUCT_COUNT, resolveShowcaseProducts } from '@/lib/home-product-sliders'
import { CATALOG_DESIGN_CATEGORY_SLUG, CATALOG_TECHNICAL_CATEGORY_SLUG } from '@/lib/catalog-filters'
import { HomePageSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'

type Props = {
  initialContent?: HomePageContent | null
  initialProductSliders?: HomeProductSliderDTO[] | null
  initialBrands?: BrandListItemDTO[]
  initialFeaturedGuides?: Array<{ category: string; title: string; meta: string; href: string }>
}

export function HomePage({
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
  const [queryTechnicalProducts, setQueryTechnicalProducts] = useState<ProductCardDTO[]>([])
  const [featuredGuides, setFeaturedGuides] = useState<
    Array<{ category: string; title: string; meta: string; href: string }>
  >(
    initialFeaturedGuides.map((guide) => ({
      category: guide.category,
      title: guide.title,
      meta: guide.meta,
      href: guide.href,
    })),
  )
  const [hubBrands, setHubBrands] = useState<BrandListItemDTO[]>(initialBrands)

  const showcaseSource = useMemo((): HomePageContent | null => {
    const raw = snap.pages.home ?? initialContent
    if (!raw || !isHomePageContent(raw)) return null
    return raw as HomePageContent
  }, [snap.pages.home, initialContent])

  const content = showcaseSource

  const designProducts = useMemo(
    () => resolveShowcaseProducts(productSliders, 'top-design', queryDesignProducts),
    [productSliders, queryDesignProducts],
  )

  const technicalProducts = useMemo(
    () => resolveShowcaseProducts(productSliders, 'top-technical', queryTechnicalProducts),
    [productSliders, queryTechnicalProducts],
  )

  const extraSliders = useMemo(() => extraHomeProductSliders(productSliders), [productSliders])

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

  useLayoutEffect(() => {
    if (initialContent) {
      hydrateSitePageContent('home', locale, initialContent)
    }
  }, [initialContent, locale])

  useEffect(() => {
    void fetchSitePage('home', locale, { skipIfFresh: true })

    if (initialFeaturedGuides.length === 0) {
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
    }

    if (initialBrands.length === 0) {
      void api.catalog
        .brands()
        .then((data) => setHubBrands(data.items))
        .catch(() => setHubBrands([]))
    }

    if (initialProductSliders && initialProductSliders.length > 0) return

    const cachedSliders = readHomeProductSlidersClientCache(locale)
    if (cachedSliders && cachedSliders.length > 0) {
      setProductSliders(cachedSliders)
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
    if (!showcaseSource) return

    const designFromSlider = productSliders.find((s) => s.key === 'top-design')?.products ?? []
    const technicalFromSlider = productSliders.find((s) => s.key === 'top-technical')?.products ?? []
    if (designFromSlider.length > 0 && technicalFromSlider.length > 0) return

    const designQuery = showcaseSource.designShowcase.searchQuery?.trim()
    const technicalQuery = showcaseSource.technicalShowcase.searchQuery?.trim()

    void Promise.all([
      designFromSlider.length === 0
        ? fetchProductsByQuery(designQuery ?? '', {
            pageSize: Math.max(showcaseSource.designShowcase.productCount, HOME_SLIDER_PRODUCT_COUNT),
            locale,
            category: CATALOG_DESIGN_CATEGORY_SLUG,
          })
        : Promise.resolve([]),
      technicalFromSlider.length === 0
        ? fetchProductsByQuery(technicalQuery ?? '', {
            pageSize: Math.max(showcaseSource.technicalShowcase.productCount, HOME_SLIDER_PRODUCT_COUNT),
            locale,
            category: CATALOG_TECHNICAL_CATEGORY_SLUG,
          })
        : Promise.resolve([]),
    ]).then(([design, technical]) => {
      if (design.length > 0) setQueryDesignProducts(design)
      if (technical.length > 0) setQueryTechnicalProducts(technical)
    })
  }, [showcaseSource, locale, productSliders])

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
          extraSliders={extraSliders}
          homeBrands={homeBrands}
        />
      ) : null}
    </PageLoadTransition>
  )
}
