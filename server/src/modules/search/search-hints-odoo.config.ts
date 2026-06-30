import { env } from '../../config/env.js'

export function searchHintsOdooLookbackDays(): number {
  return Math.max(1, Math.min(env.SEARCH_HINTS_LOOKBACK_DAYS, 365))
}

export function searchHintsOdooLimit(): number {
  return Math.max(1, Math.min(env.SEARCH_HINTS_LIMIT, 20))
}

export function searchHintsOdooStaleMs(): number {
  return Math.max(1, env.SEARCH_HINTS_STALE_HOURS) * 3_600_000
}

export function isSearchHintsAutoSyncEnabled(): boolean {
  return env.SEARCH_HINTS_AUTO_SYNC_ENABLED
}
