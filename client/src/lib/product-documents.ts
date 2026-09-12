import type { ProductDocumentDTO } from '@/types/dto'

function documentKey(doc: ProductDocumentDTO): string {
  if (doc.id) return `id:${doc.id}`
  if (doc.url) return `url:${doc.url}`
  if (doc.publicCurrentUrl) return `public:${doc.publicCurrentUrl}`
  return `name:${doc.name}`
}

export function isProductDocumentDownloadable(doc: ProductDocumentDTO): boolean {
  return Boolean(doc.url?.trim() || doc.publicCurrentUrl?.trim())
}

type DocumentsSource = {
  documents?: readonly ProductDocumentDTO[] | null
}

/** Unisce documenti template + variante senza duplicati (per id, url o nome). */
export function mergeProductDocuments(
  product: DocumentsSource,
  variant?: DocumentsSource | null,
): ProductDocumentDTO[] {
  const merged: ProductDocumentDTO[] = []
  const seen = new Set<string>()

  for (const doc of [...(product.documents ?? []), ...(variant?.documents ?? [])]) {
    if (!isProductDocumentDownloadable(doc)) continue
    const key = documentKey(doc)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(doc)
  }

  return merged
}

export function catalogDocumentDownloadPath(
  slug: string,
  documentId: string,
  variantRef?: string | null,
): string {
  const search = new URLSearchParams({ source: `pdp:${slug}` })
  if (variantRef) search.set('variantRef', variantRef)
  return `/api/v1/catalog/products/${encodeURIComponent(slug)}/documents/${encodeURIComponent(documentId)}/download?${search}`
}

/** Preferisce il proxy PWA (302 su `/web/content/...?download=true`) così il file si scarica. */
export function resolveProductDocumentHref(
  doc: ProductDocumentDTO,
  options: { slug: string; variantRef?: string | null; apiBase?: string | null },
): string {
  const base = (options.apiBase ?? '').replace(/\/$/, '')
  if (options.slug && doc.id) {
    return `${base}${catalogDocumentDownloadPath(options.slug, doc.id, options.variantRef)}`
  }
  return doc.publicCurrentUrl?.trim() || doc.url
}
