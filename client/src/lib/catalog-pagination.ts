export const CATALOG_INFINITE_SCROLL_ROOT_MARGIN = '1400px 0px'

type PaginationSlice = {
  pageSize: number
  total: number
}

export function catalogPendingLoadCount(
  isLoadingMore: boolean,
  pagination: PaginationSlice,
  loadedRawCount: number,
): number {
  if (!isLoadingMore) return 0
  if (pagination.total > 0) {
    return Math.min(pagination.pageSize, Math.max(0, pagination.total - loadedRawCount))
  }
  return pagination.pageSize
}
