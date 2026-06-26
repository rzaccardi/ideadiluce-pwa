import type { ProductDetailDTO, ProductDocumentDTO, ProductVariantDTO } from '@/types/dto'

function documentKey(doc: ProductDocumentDTO): string {
  if (doc.id) return `id:${doc.id}`
  if (doc.url) return `url:${doc.url}`
  return `name:${doc.name}`
}

/** Unisce documenti template + variante senza duplicati (per id, url o nome). */
export function mergeProductDocuments(
  product: Pick<ProductDetailDTO, 'documents'>,
  variant?: Pick<ProductVariantDTO, 'documents'> | null,
): ProductDocumentDTO[] {
  const merged: ProductDocumentDTO[] = []
  const seen = new Set<string>()

  for (const doc of [...(product.documents ?? []), ...(variant?.documents ?? [])]) {
    const key = documentKey(doc)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(doc)
  }

  return merged
}
