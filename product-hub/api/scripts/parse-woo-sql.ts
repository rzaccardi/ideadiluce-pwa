import { readFileSync } from 'node:fs'

/** Parsea un valore SQL scalare da una stringa già trimmata. */
export function parseSqlValue(raw: string): string | number | null {
  const v = raw.trim()
  if (v === 'NULL') return null
  if (/^-?\d+$/.test(v)) return Number(v)
  if (v.startsWith("'") && v.endsWith("'")) {
    return v
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\')
  }
  return v
}

/** Splitta tuple `(a, b, 'c,d')` rispettando stringhe quotate. */
export function splitSqlTuple(inner: string): string[] {
  const parts: string[] = []
  let cur = ''
  let inStr = false
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]
    if (ch === "'" && inner[i - 1] !== '\\') {
      inStr = !inStr
      cur += ch
      continue
    }
    if (ch === ',' && !inStr) {
      parts.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}

export function extractValueRows(sql: string): string[] {
  const rows: string[] = []
  const re = /\(([^;]*?)\)(?=,\s*\(|\s*;|\s*$)/gs
  let m: RegExpExecArray | null
  while ((m = re.exec(sql)) !== null) {
    const body = m[1]?.trim()
    if (body && /^\d/.test(body)) rows.push(body)
  }
  return rows
}

export type WooPostRow = {
  id: number
  postType: 'product' | 'product_variation'
  slug: string
  postParent: number
  postStatus: string
  sku: string | null
}

export function parsePostsSql(content: string): WooPostRow[] {
  const rows: WooPostRow[] = []
  for (const body of extractValueRows(content)) {
    const p = splitSqlTuple(body)
    if (p.length < 6) continue
    const id = parseSqlValue(p[0])
    const postType = parseSqlValue(p[1])
    if (typeof id !== 'number' || postType !== 'product' && postType !== 'product_variation') continue
    const slug = parseSqlValue(p[2])
    const postParent = parseSqlValue(p[3])
    const postStatus = parseSqlValue(p[4])
    const sku = parseSqlValue(p[5])
    if (typeof slug !== 'string' || typeof postParent !== 'number' || typeof postStatus !== 'string') continue
    rows.push({
      id,
      postType,
      slug,
      postParent,
      postStatus,
      sku: typeof sku === 'string' ? sku.trim() || null : null,
    })
  }
  return rows
}

export type WooSeoRow = {
  postId: number
  permalink: string | null
  yoastTitle: string | null
  yoastMetadesc: string | null
  focusKeyword: string | null
  canonical: string | null
  noindex: boolean
  ogImage: string | null
}

export function parseYoastProductsSql(content: string): WooSeoRow[] {
  const rows: WooSeoRow[] = []
  for (const body of extractValueRows(content)) {
    const p = splitSqlTuple(body)
    if (p.length < 8) continue
    const postId = parseSqlValue(p[0])
    const subType = parseSqlValue(p[2])
    if (typeof postId !== 'number' || subType !== 'product') continue
    const permalink = parseSqlValue(p[3])
    const yoastTitle = parseSqlValue(p[4])
    const yoastMetadesc = parseSqlValue(p[5])
    const focusKeyword = parseSqlValue(p[6])
    const canonical = parseSqlValue(p[7])
    const noindexRaw = parseSqlValue(p[8])
    // Colonne dump: …, noindex, open_graph_title, open_graph_description, open_graph_image, schema_page_type
    const ogImage = p.length > 11 ? parseSqlValue(p[11]) : null
    rows.push({
      postId,
      permalink: typeof permalink === 'string' ? permalink : null,
      yoastTitle: typeof yoastTitle === 'string' ? yoastTitle : null,
      yoastMetadesc: typeof yoastMetadesc === 'string' ? yoastMetadesc : null,
      focusKeyword: typeof focusKeyword === 'string' ? focusKeyword : null,
      canonical: typeof canonical === 'string' ? canonical : null,
      noindex: noindexRaw === '1' || noindexRaw === 1,
      ogImage: typeof ogImage === 'string' ? ogImage : null,
    })
  }
  return rows
}

export type WooCategoryRow = {
  termId: number
  slug: string
  name: string
  parentTermId: number
  count: number
}

export function parseYoastCategoriesSql(content: string): WooCategoryRow[] {
  const rows: WooCategoryRow[] = []
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('INSERT INTO')) continue
    const match = /VALUES\s*\((.*)\)\s*;?\s*$/i.exec(trimmed)
    if (!match) continue
    const p = splitSqlTuple(match[1])
    if (p.length < 6) continue
    const termId = parseSqlValue(p[0])
    const taxonomy = parseSqlValue(p[1])
    if (typeof termId !== 'number' || taxonomy !== 'product_cat') continue
    const slug = parseSqlValue(p[2])
    const name = parseSqlValue(p[3])
    const parentTermId = parseSqlValue(p[4])
    const count = parseSqlValue(p[5])
    if (typeof slug !== 'string' || typeof name !== 'string' || typeof parentTermId !== 'number') continue
    rows.push({
      termId,
      slug,
      name,
      parentTermId,
      count: typeof count === 'number' ? count : 0,
    })
  }
  return rows
}

export type WooProductTermRow = {
  postId: number
  taxonomy: string
  termId: number
  slug: string
  name: string
}

export function parseYoastProductTermsSql(content: string): WooProductTermRow[] {
  const rows: WooProductTermRow[] = []
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('INSERT INTO')) continue
    const match = /VALUES\s*\((.*)\)\s*;?\s*$/i.exec(trimmed)
    if (!match) continue
    const p = splitSqlTuple(match[1])
    if (p.length < 5) continue
    const postId = parseSqlValue(p[0])
    const taxonomy = parseSqlValue(p[1])
    const termId = parseSqlValue(p[2])
    const slug = parseSqlValue(p[3])
    const name = parseSqlValue(p[4])
    if (typeof postId !== 'number' || typeof taxonomy !== 'string' || typeof termId !== 'number') continue
    if (typeof slug !== 'string' || typeof name !== 'string') continue
    rows.push({ postId, taxonomy, termId, slug, name })
  }
  return rows
}

export function readSqlFile(path: string): string {
  return readFileSync(path, 'utf8')
}

export function permalinkToPath(permalink: string | null): string | null {
  if (!permalink) return null
  try {
    const u = new URL(permalink)
    return u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`
  } catch {
    return null
  }
}

export function normalizeSku(sku: string | null): string[] {
  if (!sku) return []
  return sku
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function resolveYoastTitle(title: string | null, productTitle: string): string | null {
  if (!title) return null
  if (!title.includes('%%')) return title
  return title
    .replace(/%%title%%/g, productTitle)
    .replace(/%%sep%%/g, '-')
    .replace(/%%sitename%%/g, 'IdeaDiLuce')
    .replace(/%%page%%/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
