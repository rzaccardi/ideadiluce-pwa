import type { ProductCardDTO, ProductDetailDTO, ProductVariantDTO } from '@/types/dto'

/** Snapshot prodotto già in memoria (catalogo/PDP) per saltare OdooCatalog su POST /cart/items. */
export type CartAddProductHint = {
  /** Se manca, l’hint resta solo client-side (totale ottimistico); il POST non lo invia. */
  odooTemplateId?: number
  odooVariantId?: number | null
  slug?: string
  name?: string
  imageUrl?: string | null
  unitPriceCents?: number
  variantLabel?: string | null
  attributes?: Array<{ name: string; value: string }>
}

/** Il backend richiede `odooTemplateId`; senza, non mandare l’hint. */
export function toServerCartAddHint(
  hint?: CartAddProductHint,
): CartAddProductHint | undefined {
  if (hint?.odooTemplateId == null || hint.odooTemplateId <= 0) return undefined
  return hint
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
  const unitPriceCents = variant?.priceCents ?? product.priceCents
  if (!product.slug && !product.name && !(unitPriceCents > 0)) return undefined

  const odooTemplateId = product.odooTemplateId
  const odooVariantId =
    variant?.odooVariantId ?? parseOdooVariantId(variantRef ?? null) ?? undefined

  const attributes = (variant?.attributes ?? [])
    .filter((a) => a.name?.trim() && a.value?.trim())
    .map((a) => ({ name: a.name.trim(), value: a.value.trim() }))

  return {
    ...(odooTemplateId != null && odooTemplateId > 0 ? { odooTemplateId } : {}),
    odooVariantId: odooVariantId ?? null,
    slug: product.slug,
    name: product.name,
    imageUrl: variant?.imageUrl ?? product.imageUrl,
    ...(unitPriceCents > 0 ? { unitPriceCents } : {}),
    variantLabel: variant?.label ?? null,
    ...(attributes.length ? { attributes } : {}),
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
