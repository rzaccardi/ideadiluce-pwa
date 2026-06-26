'use client'

import { Reveal } from '@/components/motion'
import type { CategoryLandingContent } from '@/types/category-landing'
import type { ProductCardDTO } from '@/types/dto'
import { useLocalePath } from '@/hooks/use-locale-path'
import { CategoryCtaBanner } from './CategoryCtaBanner'
import { CategoryTipsSection } from './CategoryTipsSection'
import {
  TechnicalCategoryHeroSection,
  TechnicalCategorySubtypeSection,
} from './sections/TechnicalCategoryHeroSection'
import { CategoryCatalogSection } from './sections/CategoryCatalogSection'

type Props = {
  content: CategoryLandingContent
  products: ProductCardDTO[]
  totalCount?: number
  loading?: boolean
}

export function TechnicalCategoryView({ content, products, totalCount, loading }: Props) {
  const lp = useLocalePath()

  return (
    <div className="bg-white">
      <Reveal immediate>
        <TechnicalCategoryHeroSection content={content} lp={lp} />
      </Reveal>
      {content.subtypeChips?.length ? (
        <Reveal>
          <TechnicalCategorySubtypeSection chips={content.subtypeChips} lp={lp} />
        </Reveal>
      ) : null}
      <Reveal>
        <CategoryCatalogSection
          content={content}
          products={products}
          totalCount={totalCount}
          lp={lp}
          variant="technical"
          loading={loading}
        />
      </Reveal>
      {content.tips ? (
        <Reveal>
          <CategoryTipsSection section={content.tips} />
        </Reveal>
      ) : null}
      <Reveal>
        <CategoryCtaBanner banner={content.cta} lp={lp} variant="technical" />
      </Reveal>
    </div>
  )
}
