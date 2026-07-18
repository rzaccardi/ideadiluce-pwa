import { GuideHubPageSkeleton } from '@/components/Skeleton'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'

export default function GuideLoading() {
  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <SectionContainer className="py-8 sm:py-10">
          <GuideHubPageSkeleton />
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}
