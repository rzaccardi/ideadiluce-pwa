import { proxy } from 'valtio'
import type { NotFoundPathDetail, NotFoundPathList, NotFoundPathRow, NotFoundStats } from '@/types/not-found'

type State = {
  stats: NotFoundStats | null
  statsLoading: boolean
  statsError: string | null
  list: NotFoundPathList | null
  listItems: NotFoundPathRow[]
  listLoading: boolean
  listLoadingMore: boolean
  listError: string | null
  detail: NotFoundPathDetail | null
  detailItems: NotFoundPathDetail['items']
  detailLoading: boolean
  detailLoadingMore: boolean
  detailError: string | null
  detailPath: string | null
}

export const notFoundAnalyticsStore = proxy<State>({
  stats: null,
  statsLoading: false,
  statsError: null,
  list: null,
  listItems: [],
  listLoading: false,
  listLoadingMore: false,
  listError: null,
  detail: null,
  detailItems: [],
  detailLoading: false,
  detailLoadingMore: false,
  detailError: null,
  detailPath: null,
})

export function resetNotFoundAnalyticsDetail() {
  notFoundAnalyticsStore.detail = null
  notFoundAnalyticsStore.detailItems = []
  notFoundAnalyticsStore.detailError = null
  notFoundAnalyticsStore.detailPath = null
  notFoundAnalyticsStore.detailLoading = false
  notFoundAnalyticsStore.detailLoadingMore = false
}
