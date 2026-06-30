import type { ProductCardDTO } from '../../types/dto.js'

export const HOME_SLIDER_PRODUCT_COUNT = 12

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

export const HOME_PRODUCT_SLIDER_KEYS: HomeProductSliderKey[] = [
  'top-design',
  'top-technical',
  'in-stock',
  'room-soggiorno',
  'room-cucina',
  'room-bagno',
]
