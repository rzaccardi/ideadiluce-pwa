import { writeIntegrationLog } from '../../lib/integration-log.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'

/** Esegue sync Odoo fail-open: ritorna true se la sync fallisce (dati PWA già salvati). */
export async function runOdooUserProfileSync(
  ctx: OdooCallContext,
  input: {
    userId: string
    partnerId: number
    operation: 'patch_me_profile_sync' | 'patch_me_business_sync'
  },
  syncFn: () => Promise<void>,
): Promise<boolean> {
  try {
    await syncFn()
    return false
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    await writeIntegrationLog({
      service: 'odoo',
      operation: input.operation,
      correlationId: ctx.correlationId,
      success: false,
      requestRedacted: { userId: input.userId, partnerId: input.partnerId },
      responseRedacted: { error: message },
      startedAt: new Date(),
      finishedAt: new Date(),
    })
    return true
  }
}
