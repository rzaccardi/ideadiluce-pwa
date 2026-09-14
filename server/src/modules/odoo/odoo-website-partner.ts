import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { OdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { isOdooApiV2Configured } from '../../adapters/odoo-api/odooApiClient.js'

/** Partner XML-RPC storici (es. 11913) non esistono sul website API v2. */
export async function isWebsitePartnerUsable(
  ctx: OdooCallContext,
  adapter: Pick<OdooCustomerAdapter, 'getCustomerAccountByPartnerId'>,
  partnerId: number | null | undefined,
): Promise<boolean> {
  if (partnerId == null || partnerId <= 0) return false
  if (!isOdooApiV2Configured()) return true
  const account = await adapter.getCustomerAccountByPartnerId(ctx, partnerId)
  return account != null
}
