import { proxy } from 'valtio'
import { adminApi } from '@/lib/api'

export type WpMigrationRun = {
  id: string
  externalJobId: string | null
  status: string
  exportType: string
  options: unknown
  sourceUrl: string | null
  phase: string | null
  processed: number
  recordCount: number
  message: string | null
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
  updatedAt: string
}

export type WpMigrationRecord = {
  id: string
  runId: string
  batchNumber: number
  recordType: string
  objectId: string | null
  postType: string | null
  taxonomy: string | null
  termId: string | null
  currentUrl: string | null
  slug: string | null
  titleWp: string | null
  recommendedAction: string | null
  nextjsTargetUrl: string | null
  seoPriority: string | null
  notes: string | null
  payload: Record<string, unknown>
  createdAt: string
}

export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export const wpMigrationStore = proxy({
  runs: null as Paginated<WpMigrationRun> | null,
  runsLoading: false,
  runsLoadingMore: false,
  runDetail: null as WpMigrationRun | null,
  records: null as Paginated<WpMigrationRecord> | null,
  recordsLoading: false,
  recordsLoadingMore: false,
  error: null as string | null,
})

export async function fetchWpMigrationRuns(query: string, opts?: { append?: boolean }) {
  if (opts?.append) {
    wpMigrationStore.runsLoadingMore = true
  } else {
    wpMigrationStore.runsLoading = true
    wpMigrationStore.error = null
  }
  try {
    const data = await adminApi<Paginated<WpMigrationRun>>(`/admin/wp-seo-migration/runs?${query}`)
    if (opts?.append && wpMigrationStore.runs) {
      wpMigrationStore.runs = {
        ...data,
        items: [...wpMigrationStore.runs.items, ...data.items],
      }
    } else {
      wpMigrationStore.runs = data
    }
  } catch (e) {
    wpMigrationStore.error = e instanceof Error ? e.message : 'Errore caricamento migrazioni'
  } finally {
    wpMigrationStore.runsLoading = false
    wpMigrationStore.runsLoadingMore = false
  }
}

export async function fetchWpMigrationRun(runId: string) {
  wpMigrationStore.error = null
  const item = await adminApi<WpMigrationRun>(`/admin/wp-seo-migration/runs/${runId}`)
  wpMigrationStore.runDetail = item
  return item
}

export async function fetchWpMigrationRecords(
  runId: string,
  query: string,
  opts?: { append?: boolean },
) {
  if (opts?.append) {
    wpMigrationStore.recordsLoadingMore = true
  } else {
    wpMigrationStore.recordsLoading = true
    wpMigrationStore.error = null
  }
  try {
    const data = await adminApi<Paginated<WpMigrationRecord>>(
      `/admin/wp-seo-migration/runs/${runId}/records?${query}`,
    )
    if (opts?.append && wpMigrationStore.records) {
      wpMigrationStore.records = {
        ...data,
        items: [...wpMigrationStore.records.items, ...data.items],
      }
    } else {
      wpMigrationStore.records = data
    }
  } catch (e) {
    wpMigrationStore.error = e instanceof Error ? e.message : 'Errore caricamento record'
  } finally {
    wpMigrationStore.recordsLoading = false
    wpMigrationStore.recordsLoadingMore = false
  }
}

export async function patchWpMigrationRecord(
  runId: string,
  recordId: string,
  input: {
    nextjsTargetUrl?: string | null
    seoPriority?: string | null
    notes?: string | null
    recommendedAction?: string | null
  },
) {
  await adminApi(`/admin/wp-seo-migration/runs/${runId}/records/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}
