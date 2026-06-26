'use client'

import { Reveal } from '@/components/motion'
import type { CategoryLandingContent } from '@/types/category-landing'
import type { ProductCardDTO } from '@/types/dto'
import { useLocalePath } from '@/hooks/use-locale-path'
import { CategoryCtaBanner } from './CategoryCtaBanner'
import { CategoryGuideSection } from './CategoryGuideSection'
import {
  DesignCategoryHeroSection,
  DesignCategoryTypeGridSection,
} from './sections/DesignCategoryHeroSection'
import { CategoryCatalogSection } from './sections/CategoryCatalogSection'

type Props = {
  content: CategoryLandingContent
  products: ProductCardDTO[]
  totalCount?: number
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

export function DesignCategoryView({ content, products, totalCount, loading, hasMore, onLoadMore }: Props) {
  const lp = useLocalePath()

  return (
    <div className="bg-white">
      <Reveal immediate>
        <DesignCategoryHeroSection content={content} lp={lp} />
      </Reveal>
      {content.typeTiles?.length ? (
        <Reveal>
          <DesignCategoryTypeGridSection tiles={content.typeTiles} lp={lp} />
        </Reveal>
      ) : null}
      <Reveal>
        <CategoryCatalogSection
          content={content}
          products={products}
          totalCount={totalCount}
          lp={lp}
          variant="design"
          loading={loading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
        />
      </Reveal>
      {content.guide ? (
        <Reveal>
          <CategoryGuideSection section={content.guide} />
        </Reveal>
      ) : null}
      <Reveal>
        <CategoryCtaBanner banner={content.cta} lp={lp} variant="design" />
      </Reveal>
    </div>
  )
}
