import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import type { CatalogAdapter } from '../catalog/catalogAdapter.js'
import { isOdooConfigured } from './odooClient.js'
import { createMockOdooCatalogAdapter } from './odooCatalogMock.js'
import { createLiveOdooCatalogAdapter } from './odooCatalogLive.js'

export type { OdooCallContext } from './odooClient.js'
export type OdooCatalogAdapter = CatalogAdapter

/**
 * Se `ODOO_ENABLED` e configurazione XML-RPC (Odoo 18) completa → catalogo Odoo, altrimenti mock locale.
 */
export function createOdooCatalogAdapter(): CatalogAdapter {
  if (env.ODOO_ENABLED && !isOdooConfigured()) {
    logger.warn(
      'odoo.catalog: ODOO_ENABLED ma configurazione incompleta — uso catalogo mock',
    )
  }
  if (env.ODOO_ENABLED && isOdooConfigured()) {
    return createLiveOdooCatalogAdapter()
  }
  return createMockOdooCatalogAdapter()
}
