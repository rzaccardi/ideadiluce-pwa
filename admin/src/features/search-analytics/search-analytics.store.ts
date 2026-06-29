import { proxy } from 'valtio'
import type {
  CatalogSearchAnalyticsEvent,
  CatalogSearchAnalyticsList,
  CatalogSearchAnalyticsStats,
} from '@/types/search-analytics'

type State = {
  stats: CatalogSearchAnalyticsStats | null
  statsLoading: boolean
  statsError: string | null
  list: CatalogSearchAnalyticsList | null
  listItems: CatalogSearchAnalyticsEvent[]
  listLoading: boolean
  listLoadingMore: boolean
  listError: string | null
}

export const searchAnalyticsStore = proxy<State>({
  stats: null,
  statsLoading: false,
  statsError: null,
  list: null,
  listItems: [],
  listLoading: false,
  listLoadingMore: false,
  listError: null,
})
