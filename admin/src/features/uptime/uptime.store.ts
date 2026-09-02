import { proxy } from 'valtio'
import type { UptimeOverview } from '@/types/uptime'

export const adminUptimeStore = proxy({
  overview: null as UptimeOverview | null,
  loading: false,
  ensuring: false,
  error: null as string | null,
})
