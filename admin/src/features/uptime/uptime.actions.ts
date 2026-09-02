import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type { UptimeEnsureResult, UptimeOverview } from '@/types/uptime'
import { adminUptimeStore } from './uptime.store'

function errMessage(e: unknown) {
  return String(e)
}

async function loadOverview() {
  adminUptimeStore.loading = true
  adminUptimeStore.error = null
  try {
    adminUptimeStore.overview = await adminApi<UptimeOverview>('/admin/uptime')
  } catch (e) {
    adminUptimeStore.error = errMessage(e)
    adminUptimeStore.overview = null
  } finally {
    adminUptimeStore.loading = false
  }
}

export function fetchAdminUptimeOverview() {
  return dedupeAsync('admin:uptime:overview', loadOverview)
}

export async function refreshAdminUptimeOverview() {
  return loadOverview()
}

export async function ensureAdminUptimeMonitors() {
  adminUptimeStore.ensuring = true
  adminUptimeStore.error = null
  try {
    const result = await adminApi<UptimeEnsureResult>('/admin/uptime/ensure', { method: 'POST' })
    adminUptimeStore.overview = result.overview
    return result
  } catch (e) {
    adminUptimeStore.error = errMessage(e)
    throw e
  } finally {
    adminUptimeStore.ensuring = false
  }
}
