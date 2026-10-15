import type { CustomerSatellite, Session } from '@prisma/client'

export type SessionWithCustomer = Session & { user: CustomerSatellite | null }

/** Partner Odoo della sessione (identità). Null = guest. */
export function sessionOdooPartnerId(
  session?: { odooPartnerId?: number | null; user?: { odooPartnerId?: number | null } | null } | null,
): number | null {
  if (!session) return null
  if (session.odooPartnerId != null) return session.odooPartnerId
  return session.user?.odooPartnerId ?? null
}

export function isSessionLoggedIn(
  session?: { odooPartnerId?: number | null; user?: CustomerSatellite | null } | null,
): boolean {
  return Boolean(session?.user || session?.odooPartnerId != null)
}
