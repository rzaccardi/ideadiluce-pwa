/**
 * Estrae post_content / post_excerpt da dump completo wpidl_posts (struttura WordPress).
 */
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { parseSqlValue, splitSqlTuple } from './parse-woo-sql.js'

export type WooPostContentRow = {
  id: number
  postType: string
  postStatus: string
  postName: string
  postContent: string
  postExcerpt: string
}

const COL = {
  id: 0,
  postContent: 4,
  postTitle: 5,
  postExcerpt: 6,
  postStatus: 7,
  postName: 11,
  postType: 20,
} as const

function parsePostTuple(body: string): WooPostContentRow | null {
  const p = splitSqlTuple(body)
  if (p.length < 21) return null
  const id = parseSqlValue(p[COL.id])
  const postType = parseSqlValue(p[COL.postType])
  const postStatus = parseSqlValue(p[COL.postStatus])
  if (typeof id !== 'number' || typeof postType !== 'string' || typeof postStatus !== 'string') {
    return null
  }
  if (postType !== 'product' && postType !== 'product_variation') return null
  const postName = parseSqlValue(p[COL.postName])
  const postContent = parseSqlValue(p[COL.postContent])
  const postExcerpt = parseSqlValue(p[COL.postExcerpt])
  return {
    id,
    postType,
    postStatus,
    postName: typeof postName === 'string' ? postName : '',
    postContent: typeof postContent === 'string' ? postContent : '',
    postExcerpt: typeof postExcerpt === 'string' ? postExcerpt : '',
  }
}

/** Righe `(id, …)` dentro INSERT INTO `wpidl_posts`. */
function extractInsertBodies(line: string): string[] {
  const idx = line.indexOf('VALUES')
  if (idx < 0) return []
  const tail = line.slice(idx + 6)
  const bodies: string[] = []
  const re = /\(([^;]*?)\)(?=,\s*\(|\s*;|\s*$)/gs
  let m: RegExpExecArray | null
  while ((m = re.exec(tail)) !== null) {
    const body = m[1]?.trim()
    if (body && /^\d/.test(body)) bodies.push(body)
  }
  return bodies
}

export type PostContentMaps = {
  byId: Map<number, { content: string; excerpt: string }>
  bySlug: Map<string, { content: string; excerpt: string }>
}

export async function loadPostContentFromDump(dumpPath: string): Promise<PostContentMaps> {
  const byId = new Map<number, { content: string; excerpt: string }>()
  const bySlug = new Map<string, { content: string; excerpt: string }>()
  const rl = createInterface({ input: createReadStream(dumpPath, { encoding: 'utf8' }) })

  for await (const line of rl) {
    if (!line.includes('INSERT INTO `wpidl_posts`')) continue
    for (const body of extractInsertBodies(line)) {
      const row = parsePostTuple(body)
      if (!row || row.postStatus !== 'publish') continue
      if (!row.postContent && !row.postExcerpt) continue
      const payload = { content: row.postContent, excerpt: row.postExcerpt }
      byId.set(row.id, payload)
      if (row.postName) bySlug.set(row.postName, payload)
    }
  }

  return { byId, bySlug }
}
