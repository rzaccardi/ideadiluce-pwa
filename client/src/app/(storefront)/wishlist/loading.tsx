import { WishlistPageSkeleton } from '@/components/site/skeletons/wishlist-page-skeleton'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'

export default function WishlistLoading() {
  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <SectionContainer className="py-8 sm:py-10">
          <WishlistPageSkeleton count={3} />
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
