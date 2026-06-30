import { proxy } from 'valtio'
import type {
  CatalogSearchAnalyticsEvent,
  CatalogSearchAnalyticsList,
  CatalogSearchAnalyticsStats,
} from '@/types/search-analytics'
import type { SearchHintsOdooPreview } from '@/types/search-hints'

type State = {
  stats: CatalogSearchAnalyticsStats | null
  statsLoading: boolean
  statsError: string | null
  list: CatalogSearchAnalyticsList | null
  listItems: CatalogSearchAnalyticsEvent[]
  listLoading: boolean
  listLoadingMore: boolean
  listError: string | null
  odooHints: SearchHintsOdooPreview | null
  odooHintsLoading: boolean
  odooHintsApplying: boolean
  odooHintsError: string | null
  odooHintsMessage: string | null
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
  odooHints: null,
  odooHintsLoading: false,
  odooHintsApplying: false,
  odooHintsError: null,
  odooHintsMessage: null,
})
