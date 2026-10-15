import { Prisma, type CustomerSatellite, type CustomerSegment } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

async function upsertCustomerMap(email: string, odooPartnerId: number) {
  const emailLower = normalizeEmail(email)
  await prisma.odooCustomerMap.upsert({
    where: { odooPartnerId },
    create: {
      odooPartnerId,
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
      guestEmail: emailLower,
    },
    update: {
      syncStatus: 'SYNCED',
      lastSyncAt: new Date(),
      guestEmail: emailLower,
    },
  })
}

export type SatelliteProjectionInput = {
  odooPartnerId: number
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  customerSegment?: CustomerSegment
  companyName?: string | null
  vatNumber?: string | null
  pec?: string | null
  sdiCode?: string | null
  fiscalCode?: string | null
  shippingAddressJson?: Prisma.InputJsonValue | null
  /**
   * Solo path locale (ODOO_ENABLED=false). Con identity Odoo lasciare undefined → passwordHash null.
   */
  passwordHash?: string | null
  /** Se true (default con partner noto), azzera passwordHash locale. */
  clearLocalPassword?: boolean
}

/**
 * Assicura una riga satellite PWA keyed da `odooPartnerId`.
 * Chiamare SOLO dopo successo Odoo (auth/provision). Non è lookup identità.
 *
 * Ordine risoluzione:
 * 1. CustomerSatellite.odooPartnerId
 * 2. Orphan CustomerSatellite.email senza conflitti partner (riaggancio prefs, non auth)
 * 3. Create
 */
export async function ensureSatelliteProjection(
  input: SatelliteProjectionInput,
): Promise<CustomerSatellite> {
  const email = normalizeEmail(input.email)
  const clearPassword = input.clearLocalPassword !== false && input.passwordHash === undefined

  let customer =
    (await prisma.customerSatellite.findUnique({
      where: { odooPartnerId: input.odooPartnerId },
    })) ?? null

  if (!customer) {
    const byEmail = await prisma.customerSatellite.findUnique({ where: { email } })
    // Riaggancia orphan locale (id sintetico negativo) o riga senza conflitti partner.
    if (
      byEmail &&
      (byEmail.odooPartnerId === input.odooPartnerId || byEmail.odooPartnerId <= 0)
    ) {
      customer = byEmail
    }
  }

  const patch: Prisma.CustomerSatelliteUpdateInput = {
    email,
    odooPartnerId: input.odooPartnerId,
    ...(input.firstName !== undefined ? { firstName: input.firstName?.trim() || null } : {}),
    ...(input.lastName !== undefined ? { lastName: input.lastName?.trim() || null } : {}),
    ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
    ...(input.customerSegment !== undefined ? { customerSegment: input.customerSegment } : {}),
    ...(input.companyName !== undefined ? { companyName: input.companyName?.trim() || null } : {}),
    ...(input.vatNumber !== undefined ? { vatNumber: input.vatNumber?.trim() || null } : {}),
    ...(input.pec !== undefined ? { pec: input.pec?.trim() || null } : {}),
    ...(input.sdiCode !== undefined ? { sdiCode: input.sdiCode?.trim() || null } : {}),
    ...(input.fiscalCode !== undefined ? { fiscalCode: input.fiscalCode?.trim() || null } : {}),
    ...(input.shippingAddressJson !== undefined
      ? {
          shippingAddressJson:
            input.shippingAddressJson === null ? Prisma.DbNull : input.shippingAddressJson,
        }
      : {}),
    ...(input.passwordHash !== undefined
      ? { passwordHash: input.passwordHash }
      : clearPassword
        ? { passwordHash: null }
        : {}),
  }

  if (customer) {
    customer = await prisma.customerSatellite.update({
      where: { id: customer.id },
      data: patch,
    })
  } else {
    customer = await prisma.customerSatellite.create({
      data: {
        email,
        odooPartnerId: input.odooPartnerId,
        passwordHash: input.passwordHash ?? null,
        firstName: input.firstName?.trim() || null,
        lastName: input.lastName?.trim() || null,
        phone: input.phone?.trim() || null,
        customerSegment: input.customerSegment ?? 'RETAIL',
        companyName: input.companyName?.trim() || null,
        vatNumber: input.vatNumber?.trim() || null,
        pec: input.pec?.trim() || null,
        sdiCode: input.sdiCode?.trim() || null,
        fiscalCode: input.fiscalCode?.trim() || null,
        shippingAddressJson: input.shippingAddressJson ?? undefined,
      },
    })
  }

  await upsertCustomerMap(email, input.odooPartnerId)
  return customer
}
