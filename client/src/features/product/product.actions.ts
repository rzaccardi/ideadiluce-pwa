import { getCatalogPricingOptions } from '@/lib/catalog-pricing'
import { loadProductDetailPipeline, toPipelineLocale } from '@/lib/product-detail-pipeline'
import { ApiRequestError } from '@/types/api'
import { productStore } from './product.store'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore prodotto'
}

export async function fetchProduct(slug: string, locale = 'IT') {
  productStore.isLoading = true
  productStore.error = null
  productStore.currentSlug = slug
  productStore.currentLocale = locale
  try {
    const pricing = getCatalogPricingOptions()
    const product = await loadProductDetailPipeline(slug, toPipelineLocale(locale), pricing)
    productStore.product = product
    productStore.relatedProducts = product.relatedProducts ?? []
  } catch (e) {
    productStore.error = errMessage(e)
    productStore.product = null
    productStore.relatedProducts = []
  } finally {
    productStore.isLoading = false
  }
}
