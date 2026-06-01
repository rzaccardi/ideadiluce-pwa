import { api } from '@/api/endpoints'
import { ApiRequestError } from '@/types/api'
import { productStore } from './product.store'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore prodotto'
}

export async function fetchProduct(slug: string) {
  productStore.isLoading = true
  productStore.error = null
  productStore.currentSlug = slug
  try {
    const p = await api.catalog.product(slug)
    productStore.product = p
    if (p?.categorySlug) {
      const list = await api.catalog.products({ category: p.categorySlug, page: 1, pageSize: 5 })
      productStore.relatedProducts = list.items.filter((x) => x.slug !== slug).slice(0, 4)
    } else {
      productStore.relatedProducts = []
    }
  } catch (e) {
    productStore.error = errMessage(e)
    productStore.product = null
    productStore.relatedProducts = []
  } finally {
    productStore.isLoading = false
  }
}
