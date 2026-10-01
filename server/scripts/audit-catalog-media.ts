/**
 * Audit catalogo: prodotti senza immagine, senza foto "accesa", senza documento tecnico.
 *
 * Uso (server in ascolto su API_BASE, default http://127.0.0.1:4100):
 *   npx tsx server/scripts/audit-catalog-media.ts
 *   npx tsx server/scripts/audit-catalog-media.ts --out=/tmp/catalog-media-audit.csv
 *
 * Output CSV colonne: slug,name,missingImage,missingAccesa,missingDatasheet,brandSlug
 */
import { writeFileSync } from 'node:fs'

const API_BASE = (process.env.API_BASE ?? 'http://127.0.0.1:4100').replace(/\/$/, '')
const PAGE_SIZE = 48
const MAX_PAGES = Number(process.env.AUDIT_MAX_PAGES ?? 80)

type ProductCard = {
  slug: string
  name: string
  imageUrl?: string | null
  gallery?: Array<{ url?: string | null; tags?: string[] | null }> | null
  documents?: Array<{ kind?: string | null; url?: string | null }> | null
  brand?: { slug?: string | null; name?: string | null } | null
}

function hasAccesa(p: ProductCard): boolean {
  const gallery = p.gallery ?? []
  return gallery.some((img) =>
    (img.tags ?? []).some((tag) => String(tag).toLowerCase().includes('accesa')),
  )
}

function hasDatasheet(p: ProductCard): boolean {
  const docs = p.documents ?? []
  return docs.some((d) => {
    const kind = String(d.kind ?? '').toLowerCase()
    return Boolean(d.url) && (kind.includes('datasheet') || kind.includes('scheda') || kind.includes('tech'))
  })
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

async function fetchPage(page: number): Promise<{ items: ProductCard[]; totalPages: number }> {
  const url = `${API_BASE}/api/v1/catalog/search?locale=IT&page=${page}&pageSize=${PAGE_SIZE}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${url}`)
  }
  const json = (await res.json()) as {
    data?: {
      items?: ProductCard[]
      pagination?: { totalPages?: number }
    }
  }
  const items = json.data?.items ?? []
  const totalPages = json.data?.pagination?.totalPages ?? page
  return { items, totalPages }
}

async function main() {
  const outArg = process.argv.find((a) => a.startsWith('--out='))
  const outPath = outArg?.slice('--out='.length) ?? null

  const rows: string[] = [
    'slug,name,missingImage,missingAccesa,missingDatasheet,brandSlug',
  ]
  let missingImage = 0
  let missingAccesa = 0
  let missingDatasheet = 0
  let scanned = 0

  const first = await fetchPage(1)
  const totalPages = Math.min(first.totalPages || 1, MAX_PAGES)
  const pages = [first, ...Array.from({ length: totalPages - 1 }, (_, i) => null)]

  for (let page = 1; page <= totalPages; page += 1) {
    const { items } =
      page === 1 ? first : await fetchPage(page)
    for (const p of items) {
      scanned += 1
      const noImage = !p.imageUrl
      const noAccesa = !hasAccesa(p)
      const noDoc = !hasDatasheet(p)
      if (noImage) missingImage += 1
      if (noAccesa) missingAccesa += 1
      if (noDoc) missingDatasheet += 1
      if (noImage || noAccesa || noDoc) {
        rows.push(
          [
            csvEscape(p.slug),
            csvEscape(p.name ?? ''),
            noImage ? '1' : '0',
            noAccesa ? '1' : '0',
            noDoc ? '1' : '0',
            csvEscape(p.brand?.slug ?? ''),
          ].join(','),
        )
      }
    }
    process.stderr.write(`page ${page}/${totalPages} (scanned ${scanned})\n`)
  }

  const summary = [
    `# scanned=${scanned}`,
    `# missingImage=${missingImage}`,
    `# missingAccesa=${missingAccesa}`,
    `# missingDatasheet=${missingDatasheet}`,
  ].join('\n')

  const body = `${summary}\n${rows.join('\n')}\n`
  if (outPath) {
    writeFileSync(outPath, body, 'utf8')
    process.stderr.write(`wrote ${outPath}\n`)
  } else {
    process.stdout.write(body)
  }

  void pages
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
