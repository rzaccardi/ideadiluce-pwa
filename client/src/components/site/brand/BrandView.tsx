'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api/endpoints'
import { Reveal } from '@/components/motion'
import { PageLoadTransition } from '@/components/motion/PageLoadTransition'
import { StaticHubSectionSkeleton } from '@/components/Skeleton'
import { useLocalePath } from '@/hooks/use-locale-path'
import { mergeBrandCards, type BrandCategory } from '@/lib/brand.defaults'
import type { BrandListItemDTO } from '@/types/site-content'
import { BrandConsultSection } from './sections/BrandConsultSection'
import { BrandDirectorySection } from './sections/BrandDirectorySection'
import { BrandFeaturedSection } from './sections/BrandFeaturedSection'
import { BrandHeroSection } from './sections/BrandHeroSection'
import { BrandThematicSection } from './sections/BrandThematicSection'

export function BrandView() {
  const lp = useLocalePath()
  const [hubBrands, setHubBrands] = useState<BrandListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<BrandCategory | 'all'>('all')

  useEffect(() => {
    void api.catalog
      .brands()
      .then((data) => setHubBrands(data.items))
      .catch(() => setHubBrands([]))
      .finally(() => setLoading(false))
  }, [])

  const brands = useMemo(() => mergeBrandCards(hubBrands), [hubBrands])

  const featuredBrands = useMemo(
    () => brands.filter((brand) => brand.featured),
    [brands],
  )

  return (
    <div className="bg-[#f3f2ee]">
      <Reveal immediate>
        <BrandHeroSection
          lp={lp}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </Reveal>

      {loading ? (
        <PageLoadTransition isLoading skeleton={<StaticHubSectionSkeleton count={9} />}>
          {null}
        </PageLoadTransition>
      ) : (
        <>
          <Reveal immediate delay={0.05}>
            <BrandFeaturedSection brands={featuredBrands} lp={lp} />
          </Reveal>
          <Reveal>
            <BrandDirectorySection
              brands={brands}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onReset={() => setActiveFilter('all')}
              lp={lp}
            />
          </Reveal>
          <Reveal>
            <BrandThematicSection brands={brands} lp={lp} />
          </Reveal>
          <Reveal>
            <BrandConsultSection lp={lp} />
          </Reveal>
        </>
      )}
    </div>
  )
}
