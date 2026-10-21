import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { findOdooPortalUserByEmail } from '../../adapters/odoo/odooPortalUserAdapter.js'
import { authRepository } from './auth.repository.js'
import { isOdooAuthIdentityRequired } from './odoo-account-sync.service.js'

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

/**
 * Public checkout helper: does an account already exist for this email?
 * Odoo portal is the authority when identity is required; otherwise satellite fallback.
 */
export const checkEmailService = {
  async checkEmail(email: string, correlationId: string): Promise<{ exists: boolean }> {
    const normalized = normalizeEmail(email)
    if (!normalized) return { exists: false }

    const ctx: OdooCallContext = { correlationId }

    if (isOdooAuthIdentityRequired()) {
      try {
        const portal = await findOdooPortalUserByEmail(ctx, normalized)
        if (portal) return { exists: true }
      } catch {
        // Odoo unavailable: fall through to satellite so checkout can still proceed.
      }
    }

    const satellite = await authRepository.findSatelliteByEmail(normalized)
    if (satellite?.passwordHash) return { exists: true }
    if (satellite?.odooPartnerId) return { exists: true }

    return { exists: false }
  },
}
