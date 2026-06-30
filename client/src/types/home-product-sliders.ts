import type { ProductCardDTO } from '@/types/dto'

export type HomeProductSliderKey =
  | 'top-design'
  | 'top-technical'
  | 'in-stock'
  | 'room-soggiorno'
  | 'room-cucina'
  | 'room-bagno'

export type HomeProductSliderDTO = {
  key: HomeProductSliderKey
  products: ProductCardDTO[]
}
