import type { HomeProductSliderDTO, HomeProductSliderKey } from '@/types/home-product-sliders'
import type { ProductCardDTO } from '@/types/dto'

export const HOME_SLIDER_PRODUCT_COUNT = 12

const SHOWCASE_SLIDER_KEYS = new Set<HomeProductSliderKey>(['top-design', 'top-technical'])

export function productsFromHomeSlider(
  sliders: ReadonlyArray<HomeProductSliderDTO>,
  key: HomeProductSliderKey,
): ProductCardDTO[] {
  return sliders.find((slider) => slider.key === key)?.products ?? []
}

export function extraHomeProductSliders(
  sliders: ReadonlyArray<HomeProductSliderDTO>,
): HomeProductSliderDTO[] {
  return sliders.filter((slider) => !SHOWCASE_SLIDER_KEYS.has(slider.key))
}

export function resolveShowcaseProducts(
  sliders: ReadonlyArray<HomeProductSliderDTO>,
  key: HomeProductSliderKey,
  fallback: ReadonlyArray<ProductCardDTO>,
  limit = HOME_SLIDER_PRODUCT_COUNT,
): ProductCardDTO[] {
  const fromSlider = productsFromHomeSlider(sliders, key)
  const source = fromSlider.length > 0 ? fromSlider : [...fallback]
  return source.slice(0, limit)
}
