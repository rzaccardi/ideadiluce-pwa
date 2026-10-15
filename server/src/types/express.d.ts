import type { AdminSession, AdminUser, CustomerSatellite, Session } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      correlationId: string
      /** Presente dopo il middleware sessione su /api/v1 */
      sessionRecord?: Session & { user: CustomerSatellite | null }
      sessionTokenRaw?: string | null
      /** Sessione backoffice (cookie admin) */
      adminSessionRecord?: (AdminSession & { adminUser: AdminUser }) | null
      adminSessionTokenRaw?: string | null
    }
  }
}

export {}
