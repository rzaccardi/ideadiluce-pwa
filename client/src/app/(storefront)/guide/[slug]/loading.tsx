import { GuideArticlePageSkeleton } from '@/components/site/content/guide-article/GuideArticlePageSkeleton'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'

export default function GuideArticleLoading() {
  return (
    <PageFlexShell tone="paper">
      <PageFlexBody tone="paper">
        <GuideArticlePageSkeleton />
      </PageFlexBody>
    </PageFlexShell>
  )
}
