import type { User } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { OdooCustomerAccount } from '../../adapters/odoo/odooCustomerAdapter.js'
import { buildUserBusinessPatch } from '../../adapters/odoo/odooCustomerAccount.js'
import { logger } from '../../lib/logger.js'

const customerAdapter = createOdooCustomerAdapter()
const lastHydrateAt = new Map<string, number>()
const HYDRATE_COOLDOWN_MS = 5 * 60 * 1000

function needsBusinessHydrate(user: User): boolean {
  return !(
    user.companyName?.trim() &&
    user.vatNumber?.trim() &&
    user.fiscalCode?.trim() &&
    user.pec?.trim() &&
    user.sdiCode?.trim()
  )
}

/**
 * Compila i dati aziendali PWA vuoti dal partner commerciale Odoo.
 * Risolve sempre `commercial_partner_id` (via adapter) e aggiorna la mappa
 * se puntava a un child. Fail-open: se Odoo non risponde resta l'anagrafica locale.
 */
export async function hydrateUserBusinessFromOdoo(
  user: User,
  ctx?: OdooCallContext,
  options?: { account?: OdooCustomerAccount | null; force?: boolean },
): Promise<User> {
  if (!ctx || !env.ODOO_ENABLED || !isOdooConfigured()) return user
  if (!options?.force && !needsBusinessHydrate(user)) return user

  if (!options?.force && !options?.account) {
    const prev = lastHydrateAt.get(user.id)
    if (prev && Date.now() - prev < HYDRATE_COOLDOWN_MS) return user
  }

  try {
    let account = options?.account ?? null
    const map = await prisma.odooCustomerMap.findUnique({ where: { userId: user.id } })

    if (!account) {
      if (map) {
        account = await customerAdapter.getCustomerAccountByPartnerId(ctx, map.odooPartnerId)
      }
      if (!account) {
        account = await customerAdapter.getCustomerAccountByEmail(ctx, user.email)
      }
    }

    lastHydrateAt.set(user.id, Date.now())

    if (!account) {
      logger.warn('odoo_business_hydrate_partner_not_found', {
        userId: user.id,
        email: user.email,
        mappedPartnerId: map?.odooPartnerId ?? null,
        correlationId: ctx.correlationId,
      })
      return user
    }

    // Allinea la mappa al partner commerciale (sede), non a un child delivery.
    if (
      map &&
      account.commercialPartnerId > 0 &&
      map.odooPartnerId !== account.commercialPartnerId
    ) {
      try {
        await prisma.odooCustomerMap.update({
          where: { userId: user.id },
          data: { odooPartnerId: account.commercialPartnerId },
        })
      } catch {
        /* unique constraint se un altro user ha già quel partner — leave map */
      }
    }

    const patch = buildUserBusinessPatch(user, {
      contactIsCompany: account.contactIsCompany,
      firstName: account.profile.firstName,
      lastName: account.profile.lastName,
      phone: account.profile.phone ?? '',
      business: account.business,
    })
    if (!patch) return user

    return prisma.user.update({ where: { id: user.id }, data: patch })
  } catch (err) {
    logger.warn('odoo_business_hydrate_failed', {
      userId: user.id,
      err: err instanceof Error ? err.message : String(err),
      correlationId: ctx.correlationId,
    })
    return user
  }
}
