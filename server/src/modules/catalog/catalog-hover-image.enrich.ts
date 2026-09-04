import { resolveOdooCatalogCardHoverImageUrl } from '../../adapters/odoo-catalog/odooCatalogMapper.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import type { ProductCardDTO, ProductDetailDTO } from '../../types/dto.js'
import { peekCachedProductDetails } from './odoo-catalog-index.service.js'

export async function enrichProductCardsWithHoverImages<T extends ProductCardDTO>(
  locale: HubLocale,
  items: T[],
): Promise<T[]> {
  if (items.length === 0 || items.every((item) => item.hoverImageUrl)) return items

  const { detailsById, slugToId } = await peekCachedProductDetails(locale)
  if (!Object.keys(detailsById).length) return items

  return items.map((item) => {
    if (item.hoverImageUrl) return item
    const id =
      item.odooTemplateId && item.odooTemplateId > 0
        ? item.odooTemplateId
        : (slugToId[item.slug] ?? null)
    if (id == null) return item
    const detail = detailsById[String(id)]
    if (!detail) return item
    const hoverImageUrl = resolveOdooCatalogCardHoverImageUrl(detail, item.imageUrl)
    return hoverImageUrl ? { ...item, hoverImageUrl } : item
  })
}

export async function enrichProductDetailRelatedHoverImages(
  locale: HubLocale,
  product: ProductDetailDTO,
): Promise<ProductDetailDTO> {
  const [relatedProducts, accessories, alternatives] = await Promise.all([
    enrichProductCardsWithHoverImages(locale, product.relatedProducts ?? []),
    enrichProductCardsWithHoverImages(locale, product.accessories ?? []),
    enrichProductCardsWithHoverImages(locale, product.alternatives ?? []),
  ])
  return { ...product, relatedProducts, accessories, alternatives }
}
