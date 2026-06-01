import { OdooClientError, toAppError } from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'
import { hubCatalogRepository } from '../hub-catalog/hub-catalog.repository.js'
import { catalogRepository } from './catalog.repository.js'

async function withOdooAppError<T>(correlationId: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (e) {
    if (e instanceof OdooClientError) throw toAppError(e, correlationId)
    throw e
  }
}

async function useHubCatalog(): Promise<boolean> {
  if (!env.HUB_CATALOG_ENABLED) return false
  try {
    return await hubCatalogRepository.hasCatalog()
  } catch {
    return false
  }
}

export const catalogService = {
  async listCategories(correlationId: string) {
    if (await useHubCatalog()) {
      return hubCatalogRepository.findCategories()
    }
    return withOdooAppError(correlationId, () => catalogRepository.findCategories(correlationId))
  },
  async listProducts(
    correlationId: string,
    options: { categorySlug?: string; q?: string; page: number; pageSize: number },
  ) {
    if (await useHubCatalog()) {
      return hubCatalogRepository.findProducts(options)
    }
    return withOdooAppError(correlationId, () =>
      catalogRepository.findProducts(correlationId, options),
    )
  },
  async getProduct(correlationId: string, slug: string) {
    if (await useHubCatalog()) {
      return hubCatalogRepository.findProductBySlug(slug)
    }
    return withOdooAppError(correlationId, () =>
      catalogRepository.findProductBySlug(correlationId, slug),
    )
  },
}
