import { proxy } from 'valtio'
import type { IntegrationLogsList } from '@/types/integration-logs'

export const integrationLogsStore = proxy({
  list: null as IntegrationLogsList | null,
  listItems: [] as IntegrationLogsList['items'],
  listLoading: false,
  listLoadingMore: false,
  listError: null as string | null,
})
