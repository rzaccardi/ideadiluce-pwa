'use client'

import { useEffect, useState } from 'react'
import { Link, useParam } from '@/lib/navigation'
import { api } from '@/api/endpoints'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ProductGrid } from '@/components/product/ProductGrid'
import { PageHeader } from '@/components/PageHeader'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'
import { CategoryPageSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { useLocale } from '@/context/locale-context'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'
import { toPwaLocale } from '@/lib/arfly/lookup'
import type { ProductCardDTO } from '@/types/dto'

type Props = {
  initialProducts?: ProductCardDTO[]
  initialCategoryName?: string | null
}

export function CategoryPage({ initialProducts, initialCategoryName = null }: Props) {
  const slug = useParam('slug')
  const { locale } = useLocale()
  const { t } = useI18n()
  const lp = useLocalePath()
  const [products, setProducts] = useState<ProductCardDTO[]>(initialProducts ?? [])
  const [categoryName, setCategoryName] = useState<string | null>(initialCategoryName)
  const [loading, setLoading] = useState(!initialProducts?.length && !initialCategoryName)

  useEffect(() => {
    if (!slug) return

    if (initialProducts?.length) {
      setProducts(initialProducts)
      if (initialCategoryName) setCategoryName(initialCategoryName)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const pwaLocale = toPwaLocale(locale)
        const [listRes, categoriesRes] = await Promise.all([
          api.catalog.products({ locale: pwaLocale, category: slug, page: 1, pageSize: 48 }),
          api.catalog.categories(pwaLocale),
        ])
        if (cancelled) return
        const cat = categoriesRes.items.find((c) => c.slug === slug)
        setCategoryName(cat?.name ?? slug)
        setProducts(listRes.items)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug, locale, initialProducts, initialCategoryName])

  if (!slug) return null

  const title = categoryName ?? slug
  const intro = `Scopri la selezione ${title.toLowerCase()} su Idea di Luce: lampade e componenti per illuminazione d'arredo e tecnica, con filtri per brand, prezzo e disponibilità.`

  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <SectionContainer className="py-8 sm:py-10">
          <PageLoadTransition
            isLoading={loading}
            skeleton={<CategoryPageSkeleton />}
          >
            <>
              <Breadcrumb
                items={[
                  { label: t('catalog.title'), to: lp('/negozio') },
                  { label: title },
                ]}
              />
              <PageHeader title={title} description={intro} />
              <ProductGrid products={products} />
              <div className="mt-10 flex flex-wrap gap-4 text-sm">
                <Link to={lp('/ambienti')} className="font-bold text-idl-brass">
                  Scegli per ambiente →
                </Link>
                <Link to={lp('/guide')} className="font-bold text-idl-brass">
                  Guide alla scelta →
                </Link>
              </div>
            </>
          </PageLoadTransition>
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
