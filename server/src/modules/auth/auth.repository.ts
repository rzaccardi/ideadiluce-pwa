import type { CustomerSegment } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { allocateLocalPartnerId } from '../../lib/local-partner-id.js'
import { invalidateSessionCacheForSession } from '../../middlewares/session.js'

export const authRepository = {
  /**
   * Lookup satellite per email: NON autorità auth.
   * Usare solo per prefs/FK dopo che Odoo ha già autenticato/provisionato.
   */
  findSatelliteByEmail(email: string) {
    return prisma.customerSatellite.findUnique({ where: { email: email.toLowerCase() } })
  },

  /** @deprecated Alias di findSatelliteByEmail: non usare per identity resolution. */
  findUserByEmail(email: string) {
    return this.findSatelliteByEmail(email)
  },

  /**
   * Crea riga satellite. Preferire `ensureSatelliteProjection` quando c'è un partner Odoo.
   * `passwordHash` solo per path locale (ODOO_ENABLED=false).
   * Senza odooPartnerId alloca un id sintetico negativo.
   */
  async createUser(data: {
    email: string
    passwordHash?: string | null
    odooPartnerId?: number | null
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    customerSegment?: CustomerSegment
    companyName?: string | null
    vatNumber?: string | null
  }) {
    const odooPartnerId = data.odooPartnerId ?? (await allocateLocalPartnerId())
    return prisma.customerSatellite.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash ?? null,
        odooPartnerId,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        phone: data.phone ?? null,
        customerSegment: data.customerSegment ?? 'RETAIL',
        companyName: data.companyName?.trim() || null,
        vatNumber: data.vatNumber?.trim() || null,
      },
    })
  },

  deleteSessionByTokenHash(tokenHash: string) {
    return prisma.session.deleteMany({ where: { tokenHash } })
  },

  /** Collega sessione a proiezione satellite + identità Odoo. */
  async linkSessionToIdentity(
    sessionId: string,
    params: {
      odooPartnerId: number
      odooUid?: number | null
      expiresAt: Date
    },
  ) {
    invalidateSessionCacheForSession(sessionId)
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        odooPartnerId: params.odooPartnerId,
        odooUid: params.odooUid ?? null,
        expiresAt: params.expiresAt,
      },
    })
  },

  /** @deprecated Preferire linkSessionToIdentity. */
  async linkSessionToUser(sessionId: string, userId: string, expiresAt: Date) {
    const satellite = await prisma.customerSatellite.findUnique({ where: { id: userId } })
    if (!satellite) throw new Error('CustomerSatellite not found for linkSessionToUser')
    return this.linkSessionToIdentity(sessionId, {
      odooPartnerId: satellite.odooPartnerId,
      expiresAt,
    })
  },
}
