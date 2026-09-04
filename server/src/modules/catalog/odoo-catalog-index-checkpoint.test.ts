import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  appendSyncDetails,
  appendSyncEntries,
  appendSyncHistory,
  clearSyncCheckpoint,
  createSyncMeta,
  isCheckpointResumable,
  listResumableCheckpoints,
  loadSyncDetails,
  loadSyncEntries,
  markRunningHistoryInterrupted,
  nextDetailBatch,
  parseJsonl,
  remainingDetailIds,
  CATALOG_INDEX_CHECKPOINT_MAX_AGE_MS,
  readSyncHistory,
  readSyncMeta,
  writeSyncMeta,
} from './odoo-catalog-index-checkpoint.js'
import { appendFile } from 'node:fs/promises'
import type { OdooCatalogIndexEntry } from './odoo-catalog-index.service.js'

async function tmpDir() {
  return mkdtemp(path.join(os.tmpdir(), 'catalog-sync-'))
}

function entry(id: number): OdooCatalogIndexEntry {
  return {
    id: String(id),
    slug: `p-${id}`,
    title: `P ${id}`,
    odooTemplateId: id,
    searchText: `p ${id}`,
    categorySlugs: [],
    brandSlug: null,
  } as unknown as OdooCatalogIndexEntry
}

describe('catalog index checkpoint', () => {
  const dirs: string[] = []
  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
  })

  it('scarta checkpoint troppo vecchi e accetta quelli recenti', () => {
    const fresh = createSyncMeta('IT', Date.now())
    const stale = createSyncMeta('EN', Date.now() - CATALOG_INDEX_CHECKPOINT_MAX_AGE_MS - 1)
    expect(isCheckpointResumable(fresh)).toBe(true)
    expect(isCheckpointResumable(stale)).toBe(false)
    expect(isCheckpointResumable(null)).toBe(false)
  })

  it('riprende gli id dettaglio mancanti a batch', () => {
    const remaining = remainingDetailIds([1, 2, 3, 4, 5], 2, new Set([3]))
    expect(remaining).toEqual([4, 5])
    expect(nextDetailBatch(remaining, 1)).toEqual([4])
    expect(nextDetailBatch(remaining, 10)).toEqual([4, 5])
  })

  it('salva e ricarica meta + jsonl, ignorando la riga troncata', async () => {
    const dir = await tmpDir()
    dirs.push(dir)
    const meta = createSyncMeta('IT')
    meta.phase = 'details'
    meta.nextListPage = 3
    meta.entryCount = 2
    meta.detailCount = 1
    await writeSyncMeta(meta, dir)
    await appendSyncEntries('IT', [entry(1), entry(2)], dir)
    await appendSyncDetails(
      'IT',
      [{ id: 1, title: 'A', slug: 'a' } as never],
      dir,
    )
    const detailsFile = path.join(dir, 'sync-details-IT.jsonl')
    await appendFile(detailsFile, '{"id":2,"title":"tronc', 'utf8')

    const loaded = await readSyncMeta('IT', dir)
    expect(loaded?.phase).toBe('details')
    expect(loaded?.nextListPage).toBe(3)
    const entries = await loadSyncEntries('IT', dir)
    expect(entries.map((e) => e.odooTemplateId)).toEqual([1, 2])
    const details = await loadSyncDetails('IT', dir)
    expect(Object.keys(details)).toEqual(['1'])
    const parsed = await parseJsonl<{ id: number }>(detailsFile)
    expect(parsed).toEqual([{ id: 1, title: 'A', slug: 'a' }])
  })

  it('elenca solo i checkpoint riprendibili e li cancella a fine sync', async () => {
    const dir = await tmpDir()
    dirs.push(dir)
    await writeSyncMeta(createSyncMeta('IT'), dir)
    await writeSyncMeta(
      createSyncMeta('EN', Date.now() - CATALOG_INDEX_CHECKPOINT_MAX_AGE_MS - 5),
      dir,
    )
    const list = await listResumableCheckpoints(['IT', 'EN', 'FR'], dir)
    expect(list.map((r) => r.locale)).toEqual(['IT'])
    await clearSyncCheckpoint('IT', dir)
    expect(await readSyncMeta('IT', dir)).toBeNull()
  })

  it('marca running come interrupted nello storico', async () => {
    const dir = await tmpDir()
    dirs.push(dir)
    await appendSyncHistory(
      {
        startedAt: '2026-09-02T08:00:00.000Z',
        finishedAt: null,
        status: 'running',
        reason: 'startup_stale',
        locales: [{ locale: 'IT', status: 'running' }],
      },
      dir,
    )
    await markRunningHistoryInterrupted(dir)
    const runs = await readSyncHistory(dir)
    expect(runs[0]?.status).toBe('interrupted')
    expect(runs[0]?.finishedAt).toBeTruthy()
  })
})
