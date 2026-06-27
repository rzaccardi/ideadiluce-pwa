'use client'

import { useEffect, useState } from 'react'
import { Link, useParam } from '@/lib/navigation'
import { api } from '@/api/endpoints'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ProductGrid } from '@/components/product/ProductGrid'
import { PageHeader } from '@/components/PageHeader'
import { SeoHead } from '@/components/SeoHead'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'
import { CategoryPageSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { useLocale } from '@/context/locale-context'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'
import { toPwaLocale } from '@/lib/arfly/lookup'
import type { ProductCardDTO } from '@/types/dto'

export function CategoryPage() {
  const slug = useParam('slug')
  const { locale } = useLocale()
  const { t, tParams } = useI18n()
  const lp = useLocalePath()
  const [products, setProducts] = useState<ProductCardDTO[]>([])
  const [categoryName, setCategoryName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
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
  }, [slug, locale])

  if (!slug) return null

  const title = categoryName ?? slug
  const description = `Scopri i prodotti nella categoria ${title} su Idea di Luce.`

  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <SectionContainer className="py-8 sm:py-10">
          <PageLoadTransition
            isLoading={loading}
            skeleton={<CategoryPageSkeleton />}
            loadingHeader={
              <>
                <Breadcrumb
                  items={[
                    { label: t('catalog.title'), to: lp('/catalogo') },
                    { label: title },
                  ]}
                />
                <PageHeader title={title} />
              </>
            }
          >
            <>
              <SeoHead title={`${title} | ${t('brand.name')}`} description={description} />
              <Breadcrumb
                items={[
                  { label: t('catalog.title'), to: lp('/catalogo') },
                  { label: title },
                ]}
              />
              <PageHeader title={title} />
              <ProductGrid products={products} emptyMessage={t('category.empty')} />
              <p className="mt-6">
                <Link to={lp('/catalogo')} className="text-sm font-bold text-idl-brass hover:underline">
                  {tParams('category.backToCatalog', { catalog: t('catalog.title') })}
                </Link>
              </p>
            </>
          </PageLoadTransition>
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
