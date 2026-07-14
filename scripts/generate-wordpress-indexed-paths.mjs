#!/usr/bin/env node
/**
 * Genera server/src/modules/seo/wordpress-indexed-paths.ts da docs/seo/wordpress-sitemap-urls.json
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const jsonPath = join(root, 'docs/seo/wordpress-sitemap-urls.json')
const outPath = join(root, 'server/src/modules/seo/wordpress-indexed-paths.ts')

const data = JSON.parse(readFileSync(jsonPath, 'utf8'))
const paths = [...new Set(data.urls.map((u) => {
  const p = u.path.replace(/\/$/, '') || '/'
  return p
}))].sort()

const content = `/** Generato da scripts/generate-wordpress-indexed-paths.mjs — non modificare a mano. */
export const WORDPRESS_INDEXED_PATHS: readonly string[] = ${JSON.stringify(paths, null, 2)} as const

export const WORDPRESS_INDEXED_EXTRACTED_AT = ${JSON.stringify(data.extractedAt ?? null)}
export const WORDPRESS_INDEXED_SOURCE = ${JSON.stringify(data.source ?? 'https://ideadiluce.com/sitemap_index.xml')}
`

writeFileSync(outPath, content)
console.log(`Scritti ${paths.length} path in ${outPath}`)
