import type { ProductCardDTO, ProductDetailDTO, ProductVariantDTO } from '@/types/dto'

/** Snapshot prodotto già in memoria (catalogo/PDP) per saltare OdooCatalog su POST /cart/items. */
export type CartAddProductHint = {
  odooTemplateId: number
  odooVariantId?: number | null
  slug?: string
  name?: string
  imageUrl?: string | null
  unitPriceCents?: number
}

function parseOdooVariantId(variantRef: string | null | undefined): number | null {
  if (!variantRef?.trim()) return null
  const trimmed = variantRef.trim()
  if (/^\d+$/.test(trimmed)) {
    const id = Number(trimmed)
    return Number.isInteger(id) && id > 0 ? id : null
  }
  const legacy = /^VAR-(\d+)$/i.exec(trimmed)
  if (!legacy) return null
  const id = Number(legacy[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export function buildCartAddHintFromCard(
  product: Pick<
    ProductCardDTO,
    'slug' | 'name' | 'imageUrl' | 'priceCents' | 'odooTemplateId'
  >,
  variantRef?: string | null,
  variant?: ProductVariantDTO | null,
): CartAddProductHint | undefined {
  const odooTemplateId = product.odooTemplateId
  if (odooTemplateId == null || odooTemplateId <= 0) return undefined

  const odooVariantId =
    variant?.odooVariantId ?? parseOdooVariantId(variantRef ?? null) ?? undefined

  return {
    odooTemplateId,
    odooVariantId: odooVariantId ?? null,
    slug: product.slug,
    name: product.name,
    imageUrl: product.imageUrl,
    unitPriceCents: variant?.priceCents ?? product.priceCents,
  }
}

export function buildCartAddHintFromDetail(
  product: ProductDetailDTO,
  variantRef?: string | null,
): CartAddProductHint | undefined {
  const variant =
    (variantRef
      ? product.variants.find((v) => v.ref === variantRef || String(v.odooVariantId) === variantRef)
      : undefined) ?? product.variants[0]
  return buildCartAddHintFromCard(product, variantRef, variant)
}
