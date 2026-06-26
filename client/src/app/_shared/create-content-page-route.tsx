import type { SitePageKey } from '@/types/site-content'
import { ContentPage } from '@/views/ContentPage'

export function createContentPageRoute(pageKey: SitePageKey) {
  return function Page() {
    return <ContentPage pageKey={pageKey} />
  }
}
