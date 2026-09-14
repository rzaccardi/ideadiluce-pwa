import type { ProductCardDTO } from '@/types/dto'
import type { ProductCatalogKind } from '@/lib/product-catalog-kind'

export type ProductImageObjectFit = 'object-cover' | 'object-contain'

/** Packshot/scheda/componente: contain (niente crop). Ambiente/lifestyle: cover. */
export function productGalleryObjectFitClass(tag: string | undefined): ProductImageObjectFit {
  return (tag || 'foto') === 'ambiente' ? 'object-cover' : 'object-contain'
}

/** Card catalogo: riempie il riquadro (cover), arredo e tecnico. */
export function productCatalogObjectFitClass(_kind: ProductCatalogKind): ProductImageObjectFit {
  return 'object-cover'
}

export function productCardObjectFitClass(_product: ProductCardDTO): ProductImageObjectFit {
  return 'object-cover'
}

export function productSearchThumbObjectFitClass(input: {
  specTags?: readonly string[]
  label?: string
}): ProductImageObjectFit {
  if (input.specTags?.length) return 'object-contain'
  if (input.label && /\b(driver|alimentator|starter|dimmer|ricambio|component)\b/i.test(input.label)) {
    return 'object-contain'
  }
  return 'object-cover'
}
