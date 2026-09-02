import type { ProductCardDTO } from '@/types/dto'
import { resolveProductCardCatalogKind, type ProductCatalogKind } from '@/lib/product-catalog-kind'

export type ProductImageObjectFit = 'object-cover' | 'object-contain'

/** Packshot/scheda/componente: contain (niente crop). Ambiente/lifestyle: cover. */
export function productGalleryObjectFitClass(tag: string | undefined): ProductImageObjectFit {
  return (tag || 'foto') === 'ambiente' ? 'object-cover' : 'object-contain'
}

/** Catalogo tecnico: foto spesso non quadrate (schede, driver). Arredo: cover. */
export function productCatalogObjectFitClass(kind: ProductCatalogKind): ProductImageObjectFit {
  return kind === 'technical' ? 'object-contain' : 'object-cover'
}

export function productCardObjectFitClass(product: ProductCardDTO): ProductImageObjectFit {
  return productCatalogObjectFitClass(resolveProductCardCatalogKind(product))
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
