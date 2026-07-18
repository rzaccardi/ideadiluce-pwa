import { ContentPageSkeleton } from '@/components/Skeleton'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { SectionContainer } from '@/components/site/primitives'

/** Fallback generico per pagine editoriali/statiche senza loading dedicato. */
export function ContentRouteLoading() {
  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <SectionContainer className="py-8 sm:py-10">
          <ContentPageSkeleton />
        </SectionContainer>
      </PageFlexBody>
    </PageFlexShell>
  )
}

export default ContentRouteLoading
