import { proxy } from 'valtio'
import type { AdminBrandRow } from '@/types/brands'

export const brandsStore = proxy({
  items: [] as AdminBrandRow[],
  isLoading: false,
  error: null as string | null,
  busySlug: null as string | null,
})
