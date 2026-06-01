/**
 * Estrae post_content / post_excerpt da dump wpidl_posts.
 * Supporta formato WordPress completo (~23 colonne) e export ridotto a 6 colonne.
 */
import { readFileSync } from 'node:fs'
import { parseSqlValue, splitSqlTuple } from './parse-woo-sql.js'

export type WooPostContentRow = {
  id: number
  postType: string
  postStatus: string
  postName: string
  postContent: string
  postExcerpt: string
}

type ColumnMap = {
  id: number
  postType: number
  postStatus: number
  postName: number
  postExcerpt: number
  postContent: number
}

const COL_FULL: ColumnMap = {
  id: 0,
  postContent: 4,
  postExcerpt: 6,
  postStatus: 7,
  postName: 11,
  postType: 20,
}

/** Export phpMyAdmin: ID, post_type, post_status, post_name, post_excerpt, post_content */
const COL_PROJECTED: ColumnMap = {
  id: 0,
  postType: 1,
  postStatus: 2,
  postName: 3,
  postExcerpt: 4,
  postContent: 5,
}

function detectColumnMap(sampleTuple: string): ColumnMap | null {
  const p = splitSqlTuple(sampleTuple)
  if (p.length >= 10) return COL_FULL
  if (p.length >= 6) return COL_PROJECTED
  return null
}

function parsePostTuple(body: string, col: ColumnMap): WooPostContentRow | null {
  const p = splitSqlTuple(body)
  if (p.length < 6) return null
  const id = parseSqlValue(p[col.id])
  const postType = parseSqlValue(p[col.postType])
  const postStatus = parseSqlValue(p[col.postStatus])
  if (typeof id !== 'number' || typeof postType !== 'string' || typeof postStatus !== 'string') {
    return null
  }
  if (postType !== 'product' && postType !== 'product_variation') return null
  const postName = parseSqlValue(p[col.postName])
  const postContent = parseSqlValue(p[col.postContent])
  const postExcerpt = parseSqlValue(p[col.postExcerpt])
  return {
    id,
    postType,
    postStatus,
    postName: typeof postName === 'string' ? postName : '',
    postContent: typeof postContent === 'string' ? postContent : '',
    postExcerpt: typeof postExcerpt === 'string' ? postExcerpt : '',
  }
}

/** Estrae corpi tuple `(a,'b,c',d)` rispettando stringhe SQL quotate. */
function extractInsertBodies(valuesSection: string): string[] {
  const bodies: string[] = []
  let i = 0
  while (i < valuesSection.length) {
    if (valuesSection[i] !== '(') {
      i++
      continue
    }
    let depth = 0
    let inStr = false
    const start = i
    for (; i < valuesSection.length; i++) {
      const ch = valuesSection[i]
      if (ch === "'" && valuesSection[i - 1] !== '\\') {
        inStr = !inStr
        continue
      }
      if (inStr) continue
      if (ch === '(') depth++
      else if (ch === ')') {
        depth--
        if (depth === 0) {
          const inner = valuesSection.slice(start + 1, i).trim()
          if (/^\d/.test(inner)) bodies.push(inner)
          i++
          break
        }
      }
    }
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

  const head = readFileSync(dumpPath, 'utf8').slice(0, 12_000)
  let columnMap: ColumnMap | null = null
  const sampleMatch = /VALUES\s*\((\d+,[^;]{0,200})/i.exec(head)
  if (sampleMatch?.[1]) {
    columnMap = detectColumnMap(sampleMatch[1] + ')')
  }
  if (!columnMap && head.includes('post_content')) {
    columnMap = COL_PROJECTED
  }
  if (!columnMap) columnMap = COL_FULL

  const sql = readFileSync(dumpPath, 'utf8')
  const blocks = sql.split(/INSERT INTO `wpidl_posts`/gi).slice(1)

  for (const block of blocks) {
    const valuesIdx = block.indexOf('VALUES')
    if (valuesIdx < 0) continue
    const section = block.slice(valuesIdx + 6)
    for (const body of extractInsertBodies(section)) {
      const row = parsePostTuple(body, columnMap)
      if (!row || row.postStatus !== 'publish') continue
      if (!row.postContent && !row.postExcerpt) continue
      const payload = { content: row.postContent, excerpt: row.postExcerpt }
      byId.set(row.id, payload)
      if (row.postName) bySlug.set(row.postName, payload)
    }
  }

  return { byId, bySlug }
}
