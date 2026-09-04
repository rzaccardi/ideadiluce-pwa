import type { ProductCardDTO, ProductRelatedDTO } from '@/types/dto'

/** Solo equivalenti dichiarati da Odoo (`relation: alternative`). Niente fallback related. */
export function selectTechnicalEquivalents(
  products: ReadonlyArray<ProductRelatedDTO | ProductCardDTO> | undefined,
  currentSlug: string,
): Array<ProductRelatedDTO | ProductCardDTO> {
  if (!products?.length) return []
  return products.filter((item) => {
    if (!item.slug || item.slug === currentSlug) return false
    if ('relation' in item && item.relation && item.relation !== 'alternative') return false
    return true
  })
}
