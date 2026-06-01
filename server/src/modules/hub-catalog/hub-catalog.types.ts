import type { ProductDetailDTO, ProductVariantDTO } from '../../types/dto.js'

export type HubProductVariantDTO = ProductVariantDTO & {
  odooVariantId: number | null
}

export type HubProductDetailDTO = ProductDetailDTO & {
  odooTemplateId: number | null
  variants: HubProductVariantDTO[]
}
