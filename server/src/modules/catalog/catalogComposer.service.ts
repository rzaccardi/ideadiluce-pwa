import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { ProductCardDTO, ProductDetailDTO, ProductListDTO, ProductVariantDTO } from '../../types/dto.js'
import type { HubProductDetailDTO } from '../hub-catalog/hub-catalog.types.js'
import {
  fetchOdooLiveCatalogData,
  resolveHubInStock,
  resolveHubPriceCents,
} from '../hub-catalog/hubCatalogOdoo.service.js'
import { formatOdooVariantRef } from './odooRef.js'

function collectOdooIds(products: HubProductDetailDTO[]) {
  const templateIds: number[] = []
  const variantIds: number[] = []
  for (const p of products) {
    if (p.odooTemplateId) templateIds.push(p.odooTemplateId)
    for (const v of p.variants) {
      if (v.odooVariantId) variantIds.push(v.odooVariantId)
    }
  }
  return { templateIds, variantIds }
}

function applyLiveData(
  product: HubProductDetailDTO,
  odoo: Awaited<ReturnType<typeof fetchOdooLiveCatalogData>>,
): ProductDetailDTO {
  const templateId = product.odooTemplateId ?? null
  const variantOdooIds = product.variants
    .map((v) => v.odooVariantId)
    .filter((id): id is number => id != null)

  const defaultVariant = product.variants.find((v) => v.odooVariantId) ?? product.variants[0]
  const priceCents = resolveHubPriceCents(
    odoo,
    templateId,
    defaultVariant?.odooVariantId ?? null,
    product.priceCents,
  )

  const variants: ProductVariantDTO[] = product.variants.map((v) => ({
    ref: v.odooVariantId != null ? formatOdooVariantRef(v.odooVariantId) : v.ref,
    label: v.label,
    imageUrl: v.imageUrl,
    attributes: v.attributes,
    odooVariantId: v.odooVariantId ?? null,
  }))

  return {
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    longDescription: product.longDescription,
    priceCents,
    currency: product.currency,
    imageUrl: product.imageUrl,
    images: product.images,
    categorySlug: product.categorySlug,
    sku: product.sku,
    inStock: resolveHubInStock(
      odoo,
      defaultVariant?.odooVariantId ?? null,
      variantOdooIds,
      product.inStock,
    ),
    odooTemplateId: templateId,
    variants,
  }
}

export async function composeHubProduct(
  ctx: OdooCallContext,
  product: HubProductDetailDTO,
): Promise<ProductDetailDTO> {
  const { templateIds, variantIds } = collectOdooIds([product])
  const odoo = await fetchOdooLiveCatalogData(ctx, templateIds, variantIds)
  return applyLiveData(product, odoo)
}

export async function composeHubProductList(
  ctx: OdooCallContext,
  list: ProductListDTO,
  items: HubProductDetailDTO[],
): Promise<ProductListDTO> {
  const { templateIds, variantIds } = collectOdooIds(items)
  const odoo = await fetchOdooLiveCatalogData(ctx, templateIds, variantIds)

  const cards: ProductCardDTO[] = items.map((p, i) => {
    const live = applyLiveData(p, odoo)
    const card = list.items[i]
    return {
      ...card,
      priceCents: live.priceCents,
    }
  })

  return { ...list, items: cards }
}
