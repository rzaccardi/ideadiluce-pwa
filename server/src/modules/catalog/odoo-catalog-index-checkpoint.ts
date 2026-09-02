/**
 * Checkpoint e storico del sync indice catalogo.
 * Permette di riprendere lista/dettagli paginati dopo un crash o un restart.
 */
import { appendFile, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { HubLocale } from '../../lib/hub-locale.js'
import type { OdooCatalogProductDetail } from '../../adapters/odoo-catalog/odooCatalog.types.js'
import type { OdooCatalogIndexEntry } from './odoo-catalog-index.service.js'

export const CATALOG_INDEX_CHECKPOINT_VERSION = 1
/** Oltre questa età il checkpoint si considera abbandonato e si riparte da zero. */
export const CATALOG_INDEX_CHECKPOINT_MAX_AGE_MS = 24 * 60 * 60 * 1000
const HISTORY_LIMIT = 30

export type CatalogIndexSyncPhase = 'list' | 'details' | 'promote'

export type CatalogIndexSyncMeta = {
  version: number
  locale: HubLocale
  phase: CatalogIndexSyncPhase
  startedAt: number
  updatedAt: number
  nextListPage: number
  listTotalPages: number | null
  /** Prossimo indice nell'array entries di cui manca il dettaglio. */
  nextDetailIndex: number
  entryCount: number
  detailCount: number
  failedDetailIds: number[]
  resumedFrom: number | null
}

export type CatalogIndexSyncProgressDTO = {
  locale: HubLocale
  phase: CatalogIndexSyncPhase
  nextListPage: number
  listTotalPages: number | null
  entryCount: number
  detailCount: number
  failedDetailIds: number
  startedAt: string
  updatedAt: string
  resumed: boolean
}

export type CatalogIndexSyncHistoryLocale = {
  locale: HubLocale
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  count?: number
  details?: number
  listPages?: number
  resumed?: boolean
  error?: string
}

export type CatalogIndexSyncHistoryEntry = {
  startedAt: string
  finishedAt: string | null
  status: 'running' | 'completed' | 'failed' | 'interrupted'
  reason: string
  locales: CatalogIndexSyncHistoryLocale[]
}

export function catalogIndexCacheDir(): string {
  return path.join(process.cwd(), '.cache', 'catalog')
}

export function syncMetaPath(locale: HubLocale, dir = catalogIndexCacheDir()): string {
  return path.join(dir, `sync-meta-${locale}.json`)
}

export function syncEntriesPath(locale: HubLocale, dir = catalogIndexCacheDir()): string {
  return path.join(dir, `sync-entries-${locale}.jsonl`)
}

export function syncDetailsPath(locale: HubLocale, dir = catalogIndexCacheDir()): string {
  return path.join(dir, `sync-details-${locale}.jsonl`)
}

function historyPath(dir = catalogIndexCacheDir()): string {
  return path.join(dir, 'sync-history.json')
}

export function createSyncMeta(locale: HubLocale, now = Date.now()): CatalogIndexSyncMeta {
  return {
    version: CATALOG_INDEX_CHECKPOINT_VERSION,
    locale,
    phase: 'list',
    startedAt: now,
    updatedAt: now,
    nextListPage: 1,
    listTotalPages: null,
    nextDetailIndex: 0,
    entryCount: 0,
    detailCount: 0,
    failedDetailIds: [],
    resumedFrom: null,
  }
}

export function isCheckpointResumable(
  meta: CatalogIndexSyncMeta | null,
  now = Date.now(),
): meta is CatalogIndexSyncMeta {
  if (!meta) return false
  if (meta.version !== CATALOG_INDEX_CHECKPOINT_VERSION) return false
  if (now - meta.startedAt > CATALOG_INDEX_CHECKPOINT_MAX_AGE_MS) return false
  return meta.phase === 'list' || meta.phase === 'details' || meta.phase === 'promote'
}

export function remainingDetailIds(
  entryIds: number[],
  nextDetailIndex: number,
  alreadyHave: Set<number>,
): number[] {
  return entryIds.slice(Math.max(0, nextDetailIndex)).filter((id) => id > 0 && !alreadyHave.has(id))
}

export function nextDetailBatch(remaining: number[], batchSize: number): number[] {
  if (batchSize <= 0) return []
  return remaining.slice(0, batchSize)
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
}

async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath))
  const tmp = `${filePath}.tmp`
  await writeFile(tmp, `${JSON.stringify(data)}\n`, 'utf8')
  await rename(tmp, filePath)
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function parseJsonl<T>(filePath: string): Promise<T[]> {
  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch {
    return []
  }
  const items: T[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      items.push(JSON.parse(trimmed) as T)
    } catch {
      /* ultima riga troncata da un crash: si ignora e si rifà quella unità */
    }
  }
  return items
}

export async function appendJsonl(filePath: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath))
  await appendFile(filePath, `${JSON.stringify(value)}\n`, 'utf8')
}

export async function readSyncMeta(
  locale: HubLocale,
  dir = catalogIndexCacheDir(),
): Promise<CatalogIndexSyncMeta | null> {
  const parsed = await readJson<CatalogIndexSyncMeta>(syncMetaPath(locale, dir))
  if (!parsed || parsed.locale !== locale) return null
  return parsed
}

export async function writeSyncMeta(
  meta: CatalogIndexSyncMeta,
  dir = catalogIndexCacheDir(),
): Promise<void> {
  meta.updatedAt = Date.now()
  await writeJsonAtomic(syncMetaPath(meta.locale, dir), meta)
}

export async function loadSyncEntries(
  locale: HubLocale,
  dir = catalogIndexCacheDir(),
): Promise<OdooCatalogIndexEntry[]> {
  const rows = await parseJsonl<OdooCatalogIndexEntry>(syncEntriesPath(locale, dir))
  const byId = new Map<number, OdooCatalogIndexEntry>()
  for (const row of rows) {
    if (row?.odooTemplateId > 0) byId.set(row.odooTemplateId, row)
  }
  return [...byId.values()]
}

export async function loadSyncDetails(
  locale: HubLocale,
  dir = catalogIndexCacheDir(),
): Promise<Record<string, OdooCatalogProductDetail>> {
  const rows = await parseJsonl<OdooCatalogProductDetail>(syncDetailsPath(locale, dir))
  const detailsById: Record<string, OdooCatalogProductDetail> = {}
  for (const row of rows) {
    if (row?.id != null) detailsById[String(row.id)] = row
  }
  return detailsById
}

export async function appendSyncEntries(
  locale: HubLocale,
  entries: OdooCatalogIndexEntry[],
  dir = catalogIndexCacheDir(),
): Promise<void> {
  if (!entries.length) return
  await ensureDir(dir)
  const chunk = entries.map((entry) => `${JSON.stringify(entry)}\n`).join('')
  await appendFile(syncEntriesPath(locale, dir), chunk, 'utf8')
}

export async function appendSyncDetails(
  locale: HubLocale,
  details: OdooCatalogProductDetail[],
  dir = catalogIndexCacheDir(),
): Promise<void> {
  if (!details.length) return
  await ensureDir(dir)
  const chunk = details.map((detail) => `${JSON.stringify(detail)}\n`).join('')
  await appendFile(syncDetailsPath(locale, dir), chunk, 'utf8')
}

export async function clearSyncCheckpoint(
  locale: HubLocale,
  dir = catalogIndexCacheDir(),
): Promise<void> {
  await Promise.all(
    [syncMetaPath(locale, dir), syncEntriesPath(locale, dir), syncDetailsPath(locale, dir)].map(
      (file) => unlink(file).catch(() => undefined),
    ),
  )
}

export async function listResumableCheckpoints(
  locales: HubLocale[],
  dir = catalogIndexCacheDir(),
  now = Date.now(),
): Promise<CatalogIndexSyncProgressDTO[]> {
  const out: CatalogIndexSyncProgressDTO[] = []
  for (const locale of locales) {
    const meta = await readSyncMeta(locale, dir)
    if (!isCheckpointResumable(meta, now)) continue
    out.push(toProgressDto(meta))
  }
  return out
}

export function toProgressDto(meta: CatalogIndexSyncMeta): CatalogIndexSyncProgressDTO {
  return {
    locale: meta.locale,
    phase: meta.phase,
    nextListPage: meta.nextListPage,
    listTotalPages: meta.listTotalPages,
    entryCount: meta.entryCount,
    detailCount: meta.detailCount,
    failedDetailIds: meta.failedDetailIds.length,
    startedAt: new Date(meta.startedAt).toISOString(),
    updatedAt: new Date(meta.updatedAt).toISOString(),
    resumed: meta.resumedFrom != null,
  }
}

export async function readSyncHistory(
  dir = catalogIndexCacheDir(),
): Promise<CatalogIndexSyncHistoryEntry[]> {
  const parsed = await readJson<{ runs?: CatalogIndexSyncHistoryEntry[] }>(historyPath(dir))
  return Array.isArray(parsed?.runs) ? parsed.runs : []
}

export async function appendSyncHistory(
  entry: CatalogIndexSyncHistoryEntry,
  dir = catalogIndexCacheDir(),
): Promise<void> {
  const runs = await readSyncHistory(dir)
  const next = [entry, ...runs.filter((r) => r.startedAt !== entry.startedAt)].slice(0, HISTORY_LIMIT)
  await writeJsonAtomic(historyPath(dir), { runs: next })
}

export async function markRunningHistoryInterrupted(
  dir = catalogIndexCacheDir(),
): Promise<void> {
  const runs = await readSyncHistory(dir)
  let changed = false
  const next = runs.map((run) => {
    if (run.status !== 'running') return run
    changed = true
    return {
      ...run,
      status: 'interrupted' as const,
      finishedAt: new Date().toISOString(),
    }
  })
  if (changed) await writeJsonAtomic(historyPath(dir), { runs: next })
}

export function upsertHistoryLocale(
  entry: CatalogIndexSyncHistoryEntry,
  localeUpdate: CatalogIndexSyncHistoryLocale,
): CatalogIndexSyncHistoryEntry {
  const locales = entry.locales.map((row) =>
    row.locale === localeUpdate.locale ? { ...row, ...localeUpdate } : row,
  )
  if (!locales.some((row) => row.locale === localeUpdate.locale)) {
    locales.push(localeUpdate)
  }
  return { ...entry, locales }
}
