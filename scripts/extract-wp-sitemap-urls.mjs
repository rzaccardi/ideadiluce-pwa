#!/usr/bin/env node
/**
 * Estrae tutti gli URL dalle sitemap Yoast WordPress.
 *
 * Uso:
 *   node scripts/extract-wp-sitemap-urls.mjs
 *   node scripts/extract-wp-sitemap-urls.mjs --base=https://ideadiluce.com --out=docs/seo
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const baseUrl = (args.find((a) => a.startsWith('--base='))?.slice('--base='.length) ?? 'https://ideadiluce.com').replace(/\/$/, '')
const outDir = args.find((a) => a.startsWith('--out='))?.slice('--out='.length) ?? 'docs/seo'

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function extractLocs(xml) {
  const urls = []
  const re = /<loc>([^<]+)<\/loc>/g
  let match
  while ((match = re.exec(xml)) !== null) {
    urls.push(decodeXmlEntities(match[1].trim()))
  }
  return urls
}

function extractSitemapRefs(xml) {
  const refs = []
  const re = /<sitemap>\s*<loc>([^<]+)<\/loc>/g
  let match
  while ((match = re.exec(xml)) !== null) {
    refs.push(decodeXmlEntities(match[1].trim()))
  }
  return refs
}

function isSitemapIndex(xml) {
  return xml.includes('<sitemapindex')
}

async function fetchXml(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/xml,text/xml,*/*' },
    redirect: 'follow',
  })
  if (!res.ok) {
    throw new Error(`${url} → HTTP ${res.status}`)
  }
  return res.text()
}

async function collectFromSitemap(sitemapUrl, visited = new Set()) {
  if (visited.has(sitemapUrl)) return []
  visited.add(sitemapUrl)

  const xml = await fetchXml(sitemapUrl)
  if (isSitemapIndex(xml)) {
    const refs = extractSitemapRefs(xml)
    const nested = await Promise.all(refs.map((ref) => collectFromSitemap(ref, visited)))
    return nested.flat()
  }

  return extractLocs(xml).map((loc) => ({
    url: loc,
    sourceSitemap: sitemapUrl,
  }))
}

function classifyUrl(url) {
  try {
    const { pathname, search } = new URL(url)
    const path = pathname.replace(/\/$/, '') || '/'
    if (search.includes('taxonomy=product_shipping_class')) return 'shipping_class'
    if (path === '/') return 'home'
    if (path.startsWith('/prodotto/')) return 'product'
    if (path.startsWith('/categoria-prodotto/')) return 'product_category'
    if (path.startsWith('/brand/')) return 'brand'
    if (path.startsWith('/product-category/')) return 'product_category'
    if (/^\/\d{4}\/\d{2}\/\d{2}\//.test(path)) return 'post'
    if (path.startsWith('/category/')) return 'blog_category'
    if (path.startsWith('/author/')) return 'author'
    if (path.includes('shipping_class') || path.includes('product_shipping_class')) return 'shipping_class'
    if (path.startsWith('/et_tb_item_type/')) return 'divi_template'
    return 'page'
  } catch {
    return 'unknown'
  }
}

function summarize(entries) {
  const byType = {}
  const bySource = {}
  for (const entry of entries) {
    const type = classifyUrl(entry.url)
    byType[type] = (byType[type] ?? 0) + 1
    const source = entry.sourceSitemap.replace(baseUrl, '')
    bySource[source] = (bySource[source] ?? 0) + 1
  }
  return { byType, bySource }
}

async function main() {
  const indexUrl = `${baseUrl}/sitemap_index.xml`
  console.log(`Fetching ${indexUrl} ...`)
  const entries = await collectFromSitemap(indexUrl)

  const uniqueByUrl = new Map()
  for (const entry of entries) {
    if (!uniqueByUrl.has(entry.url)) {
      uniqueByUrl.set(entry.url, entry)
    }
  }

  const unique = [...uniqueByUrl.values()].sort((a, b) => a.url.localeCompare(b.url))
  const summary = summarize(unique)
  const extractedAt = new Date().toISOString()

  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const targetDir = join(root, outDir)
  mkdirSync(targetDir, { recursive: true })

  const jsonPath = join(targetDir, 'wordpress-sitemap-urls.json')
  const txtPath = join(targetDir, 'wordpress-sitemap-urls.txt')
  const csvPath = join(targetDir, 'wordpress-sitemap-urls.csv')
  const summaryPath = join(targetDir, 'wordpress-sitemap-summary.json')

  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        source: indexUrl,
        extractedAt,
        totalRaw: entries.length,
        totalUnique: unique.length,
        summary,
        urls: unique.map((e) => ({
          url: e.url,
          path: new URL(e.url).pathname,
          type: classifyUrl(e.url),
          sourceSitemap: e.sourceSitemap,
        })),
      },
      null,
      2,
    ),
  )

  writeFileSync(txtPath, unique.map((e) => e.url).join('\n') + '\n')

  const csvHeader = 'url,path,type,source_sitemap\n'
  const csvBody = unique
    .map((e) => {
      const path = new URL(e.url).pathname
      const type = classifyUrl(e.url)
      const escaped = (s) => `"${String(s).replace(/"/g, '""')}"`
      return [escaped(e.url), escaped(path), escaped(type), escaped(e.sourceSitemap)].join(',')
    })
    .join('\n')
  writeFileSync(csvPath, csvHeader + csvBody + '\n')

  writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        source: indexUrl,
        extractedAt,
        totalRaw: entries.length,
        totalUnique: unique.length,
        ...summary,
      },
      null,
      2,
    ),
  )

  console.log(`\nEstratti ${unique.length} URL unici (${entries.length} raw)`)
  console.log('Per tipo:', summary.byType)
  console.log('\nFile scritti:')
  console.log(`  ${jsonPath}`)
  console.log(`  ${txtPath}`)
  console.log(`  ${csvPath}`)
  console.log(`  ${summaryPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
