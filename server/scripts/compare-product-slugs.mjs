#!/usr/bin/env node
/**
 * Confronta slug prodotti WooCommerce (export JSON) vs catalogo Arfly/Odoo.
 *
 * Uso:
 *   node server/scripts/compare-product-slugs.mjs --woo=path/to/products.json
 *   node server/scripts/compare-product-slugs.mjs --woo=products.json --apply-redirects
 *
 * Formato export atteso (array o { items: [] }):
 *   [{ "slug": "lampada-foo", "currentUrl": "/prodotto/lampada-foo/", "recordType": "product" }]
 */
import { readFileSync } from 'node:fs'
import { loadMonorepoEnv } from '../../scripts/load-monorepo-env.mjs'

loadMonorepoEnv()

const args = process.argv.slice(2)
const wooPath = args.find((a) => a.startsWith('--woo='))?.slice('--woo='.length)
const applyRedirects = args.includes('--apply-redirects')
const apiBase = (process.env.API_URL ?? process.env.PUBLIC_SITE_URL ?? 'http://localhost:4000').replace(/\/$/, '')

function parseWooExport(raw) {
  const json = JSON.parse(raw)
  const items = Array.isArray(json) ? json : json.items ?? json.records ?? []
  return items
    .map((row) => ({
      slug: String(row.slug ?? row.post_name ?? '').trim(),
      currentUrl: String(row.currentUrl ?? row.current_url ?? row.permalink ?? '').trim(),
      recordType: String(row.recordType ?? row.record_type ?? 'product').trim(),
    }))
    .filter((row) => row.slug && row.recordType === 'product')
}

async function fetchArflySlugs() {
  const slugs = new Set()
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= 50) {
    const url = `${apiBase}/api/v1/catalog/products?page=${page}&pageSize=100&locale=IT`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      throw new Error(`Catalog API ${res.status}: ${(await res.text()).slice(0, 200)}`)
    }
    const json = await res.json()
    const data = json.data ?? json
    const items = data.items ?? []
    for (const item of items) {
      if (item.slug) slugs.add(String(item.slug))
    }
    totalPages = data.totalPages ?? 1
    page += 1
  }

  return slugs
}

function legacyPathFromUrl(currentUrl) {
  if (!currentUrl) return null
  try {
    const pathname = currentUrl.startsWith('http')
      ? new URL(currentUrl).pathname
      : currentUrl
    const normalized = pathname.replace(/\/$/, '') || '/'
    return normalized
  } catch {
    return null
  }
}

async function applyRedirect(fromPath, toPath, reason) {
  const res = await fetch(`${apiBase}/api/v1/admin/seo/redirects`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Cookie: process.env.ADMIN_SESSION_COOKIE ?? '',
    },
    body: JSON.stringify({ fromPath, toPath, statusCode: 301, reason }),
  })
  if (!res.ok) {
    console.warn(`  redirect skip ${fromPath} → ${toPath}: HTTP ${res.status}`)
    return false
  }
  return true
}

async function main() {
  if (!wooPath) {
    console.error('Specificare --woo=path/to/export.json')
    process.exit(1)
  }

  const wooProducts = parseWooExport(readFileSync(wooPath, 'utf8'))
  const arflySlugs = await fetchArflySlugs()

  const missingInArfly = []
  const matched = []
  const slugMismatches = []

  for (const product of wooProducts) {
    if (arflySlugs.has(product.slug)) {
      matched.push(product)
      continue
    }

    const legacyPath = legacyPathFromUrl(product.currentUrl)
    const expectedPath = `/prodotto/${product.slug}`
    missingInArfly.push({ ...product, legacyPath, expectedPath })

    if (legacyPath && legacyPath !== expectedPath) {
      slugMismatches.push({ legacyPath, expectedPath, slug: product.slug })
    }
  }

  const onlyInArfly = [...arflySlugs].filter(
    (slug) => !wooProducts.some((p) => p.slug === slug),
  )

  console.log('=== Confronto slug WooCommerce vs Arfly ===')
  console.log(`WooCommerce prodotti: ${wooProducts.length}`)
  console.log(`Arfly slug unici:     ${arflySlugs.size}`)
  console.log(`Match:                ${matched.length}`)
  console.log(`Mancanti in Arfly:    ${missingInArfly.length}`)
  console.log(`Solo in Arfly:         ${onlyInArfly.length}`)
  console.log(`Path legacy diversi:  ${slugMismatches.length}`)

  if (missingInArfly.length) {
    console.log('\n--- Mancanti in Arfly (primi 20) ---')
    for (const row of missingInArfly.slice(0, 20)) {
      console.log(`  ${row.slug}  ${row.currentUrl || ''}`)
    }
  }

  if (slugMismatches.length) {
    console.log('\n--- Redirect suggeriti (path legacy → nuovo slug) ---')
    for (const row of slugMismatches.slice(0, 20)) {
      console.log(`  301 ${row.legacyPath} → ${row.expectedPath}`)
    }
  }

  if (applyRedirects && slugMismatches.length) {
    console.log('\n--- Applicazione redirect (richiede sessione admin) ---')
    let applied = 0
    for (const row of slugMismatches) {
      const ok = await applyRedirect(row.legacyPath, row.expectedPath, 'slug-audit:woo→pwa')
      if (ok) applied += 1
    }
    console.log(`Redirect applicati: ${applied}/${slugMismatches.length}`)
  } else if (applyRedirects) {
    console.log('\nNessun redirect da applicare.')
  }

  process.exit(missingInArfly.length ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
