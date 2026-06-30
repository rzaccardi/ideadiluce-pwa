import type { HomeProductSliderDTO, HomeProductSliderKey } from '@/types/home-product-sliders'
import type { ProductCardDTO } from '@/types/dto'

export const HOME_SLIDER_PRODUCT_COUNT = 12

/** Un solo slider extra in home, intercalato tra le altre sezioni */
const HOME_EXTRA_SLIDER_KEY: HomeProductSliderKey = 'in-stock'

export function productsFromHomeSlider(
  sliders: ReadonlyArray<HomeProductSliderDTO>,
  key: HomeProductSliderKey,
): ProductCardDTO[] {
  return sliders.find((slider) => slider.key === key)?.products ?? []
}

export function extraHomeProductSliders(
  sliders: ReadonlyArray<HomeProductSliderDTO>,
): HomeProductSliderDTO[] {
  const extra = sliders.find((slider) => slider.key === HOME_EXTRA_SLIDER_KEY)
  return extra ? [extra] : []
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
