import type {
  CatalogSearchEventKind,
  CatalogSearchSource,
  CatalogSearchTrackAction,
} from '@/types/catalog-search-events'
import { apiClient } from '@/api/client'

export type TrackCatalogSearchEventInput = {
  query: string
  locale: string
  source: CatalogSearchSource
  action: CatalogSearchTrackAction
  resultCount?: number | null
  productTotal?: number | null
  clickedPath?: string | null
  clickedKind?: CatalogSearchEventKind | null
  clickedLabel?: string | null
}

/** Fire-and-forget: non blocca la UX se il tracking fallisce. */
export function trackCatalogSearchEvent(input: TrackCatalogSearchEventInput): void {
  const query = input.query.trim()
  if (!query) return

  const body = {
    query,
    locale: input.locale,
    source: input.source,
    action: input.action,
    resultCount: input.resultCount ?? null,
    productTotal: input.productTotal ?? null,
    clickedPath: input.clickedPath ?? null,
    clickedKind: input.clickedKind ?? null,
    clickedLabel: input.clickedLabel ?? null,
  }

  void apiClient.post<{ recorded: boolean }>('/api/v1/search/events', body).catch(() => {})
}
