import type { HomePageContent } from '../site/site.types.js'
import { searchHintsOdooStaleMs } from './search-hints-odoo.config.js'

export function parseSearchHintsOdooSyncedAt(content: HomePageContent): Date | null {
  const raw = content.search.hintsOdooSyncedAt
  if (!raw || typeof raw !== 'string') return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function isSearchHintsOdooStale(
  content: HomePageContent,
  staleMs: number = searchHintsOdooStaleMs(),
  nowMs: number = Date.now(),
): boolean {
  const syncedAt = parseSearchHintsOdooSyncedAt(content)
  if (!syncedAt) return true
  return nowMs - syncedAt.getTime() > staleMs
}
