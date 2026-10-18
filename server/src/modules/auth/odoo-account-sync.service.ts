import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { generateAccountPassword } from '../../lib/generate-password.js'
import { publicAppUrl } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import {
  createOdooCustomerAdapter,
  type FindOrCreateCustomerInput,
  type OdooBusinessProfile,
} from '../../adapters/odoo/odooCustomerAdapter.js'
import { sendPwaMail } from '../../adapters/odoo/odooMailAdapter.js'
import {
  ensureOdooPortalUser,
  findOdooPortalUserByEmail,
} from '../../adapters/odoo/odooPortalUserAdapter.js'
import {
  isOdooConfigured,
  odooAuthenticatePortalUser,
  type OdooCallContext,
} from '../../adapters/odoo/odooClient.js'
import { AppError } from '../../types/errors.js'
import { authRepository } from './auth.repository.js'
import { authService, mergeCartsForUser, sessionExpiry } from './auth.service.js'
import type { UserDTO } from '../../types/dto.js'
import type { OdooCustomerAccount, OdooCustomerProfile } from '../../adapters/odoo/odooCustomerAdapter.js'
import { hydrateUserBusinessFromOdoo } from '../users/users-odoo-business-hydrate.js'
import { ensureSatelliteProjection } from './satellite-projection.service.js'
import { isUsableShippingStreet } from '../../adapters/odoo/odoo-partner-shipping.js'

const customerAdapter = createOdooCustomerAdapter()

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

/** Identità auth Odoo (partner + portal) obbligatoria quando ODOO_ENABLED e XML-RPC sono pronti. */
export function isOdooAuthIdentityRequired(): boolean {
  return Boolean(env.ODOO_ENABLED && isOdooConfigured())
}

/** Con ODOO_ENABLED=true ma env XML-RPC incompleta: fail-closed (niente account solo-PWA). */
export function assertOdooAuthReadyForIdentity(): void {
  if (!env.ODOO_ENABLED) return
  if (!isOdooConfigured()) {
    throw new AppError(
      'ODOO_MISCONFIGURED',
      'Odoo auth identity requires XML-RPC',
      'Registrazione non disponibile: configurazione Odoo incompleta. Riprova più tardi.',
      503,
      true,
    )
  }
}

export async function persistOdooCustomerMap(params: {
  email: string
  odooPartnerId: number
  /** @deprecated Ignorato — la mappa è keyed da odooPartnerId. */
  userId?: string
}) {
  const emailLower = normalizeEmail(params.email)
  await prisma.odooCustomerMap.upsert({
    where: { odooPartnerId: params.odooPartnerId },
    create: {
      odooPartnerId: params.odooPartnerId,
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

export type ProvisionOdooAuthIdentityInput = {
  email: string
  password: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  business?: OdooBusinessProfile | null
  /** Se false, un portal già esistente aggiorna la password (default true → EMAIL_TAKEN). */
  rejectExistingPortal?: boolean
}

/**
 * Crea/assicura partner + utente portal Odoo con la password scelta.
 * Fallisce se Odoo non può materializzare l'identità (fonte di verità).
 *
 * Nota email: `ensureOdooPortalUser` crea il portal con `no_reset_password`
 * (niente invito nativo auth_signup); la PWA invia `account_welcome` dopo.
 */
export async function provisionOdooAuthIdentity(
  ctx: OdooCallContext,
  input: ProvisionOdooAuthIdentityInput,
): Promise<{ odooPartnerId: number; odooUserId: number; portalCreated: boolean }> {
  assertOdooAuthReadyForIdentity()
  if (!isOdooAuthIdentityRequired()) {
    throw new AppError(
      'ODOO_DISABLED',
      'Odoo auth disabled',
      'Integrazione Odoo disattivata.',
      503,
      false,
    )
  }

  const normalized = normalizeEmail(input.email)
  const rejectExisting = input.rejectExistingPortal !== false

  if (rejectExisting) {
    const existingPortal = await findOdooPortalUserByEmail(ctx, normalized)
    if (existingPortal) {
      throw new AppError(
        'EMAIL_TAKEN',
        'Email already registered on Odoo portal',
        'Questa email è già registrata. Accedi con email e password.',
        409,
        false,
      )
    }
  }

  const partnerInput: FindOrCreateCustomerInput = {
    email: normalized,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    business: input.business ?? undefined,
  }

  let partner
  try {
    partner = await customerAdapter.findOrCreateCustomer(ctx, partnerInput)
  } catch (e) {
    logger.error('odoo.auth_identity.partner_failed', {
      correlationId: ctx.correlationId,
      email: normalized,
      error: e instanceof Error ? e.message : String(e),
    })
    throw new AppError(
      'ODOO_REGISTER_FAILED',
      'Odoo partner create failed',
      'Non siamo riusciti a creare l’account su Odoo. Riprova tra poco.',
      503,
      true,
    )
  }

  const displayName =
    [input.firstName, input.lastName].filter(Boolean).join(' ').trim() || normalized

  try {
    const portal = await ensureOdooPortalUser(ctx, {
      email: normalized,
      partnerId: partner.odooPartnerId,
      name: displayName,
      password: input.password,
    })
    return {
      odooPartnerId: partner.odooPartnerId,
      odooUserId: portal.odooUserId,
      portalCreated: portal.created,
    }
  } catch (e) {
    logger.error('odoo.auth_identity.portal_failed', {
      correlationId: ctx.correlationId,
      email: normalized,
      odooPartnerId: partner.odooPartnerId,
      error: e instanceof Error ? e.message : String(e),
    })
    throw new AppError(
      'ODOO_REGISTER_FAILED',
      'Odoo portal user create failed',
      'Non siamo riusciti ad attivare l’accesso su Odoo. Riprova tra poco.',
      503,
      true,
    )
  }
}

/** Aggiorna la password del portal Odoo (se presente). Nessuna cache password locale. */
export async function syncPasswordToOdooPortal(
  ctx: OdooCallContext,
  email: string,
  password: string,
): Promise<boolean> {
  if (!isOdooAuthIdentityRequired()) return false
  const normalized = normalizeEmail(email)
  const portal = await findOdooPortalUserByEmail(ctx, normalized)
  if (!portal) return false
  await ensureOdooPortalUser(ctx, {
    email: normalized,
    partnerId: portal.odooPartnerId,
    name: normalized,
    password,
  })
  return true
}

/**
 * Login Odoo-only: autentica portal; se fallisce o manca partner → null (PWA non “trova” locale).
 * Scrive solo proiezione satellite keyed da odooPartnerId (niente passwordHash).
 */
export async function loginWithOdooCredentials(
  ctx: OdooCallContext,
  email: string,
  password: string,
  sessionId: string,
): Promise<UserDTO | null> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return null

  const normalized = normalizeEmail(email)
  const odooUid = await odooAuthenticatePortalUser(ctx, normalized, password)
  if (!odooUid) return null

  let account: OdooCustomerAccount | null = null
  let profile: OdooCustomerProfile | null = null
  let odooPartnerId: number | null = null

  account = await customerAdapter.getCustomerAccountByEmail(ctx, normalized)
  profile = account?.profile ?? null
  odooPartnerId = account?.contactPartnerId ?? null
  if (!odooPartnerId) {
    const partner = await customerAdapter.findCustomerByEmail(ctx, normalized)
    odooPartnerId = partner?.odooPartnerId ?? null
  }
  if (!odooPartnerId) {
    const portal = await findOdooPortalUserByEmail(ctx, normalized)
    odooPartnerId = portal?.odooPartnerId ?? null
  }

  if (!odooPartnerId) {
    logger.warn('odoo.login.partner_missing_after_auth', {
      correlationId: ctx.correlationId,
      email: normalized,
      odooUid,
    })
    return null
  }

  const shippingAddressJson = isUsableShippingStreet(profile?.line1)
    ? {
        firstName: profile!.firstName,
        lastName: profile!.lastName,
        line1: profile!.line1,
        line2: profile!.line2 ?? '',
        city: profile!.city,
        postalCode: profile!.postalCode,
        province: profile!.province,
        country: profile!.country,
        phone: profile!.phone ?? '',
      }
    : undefined

  const satellite = await ensureSatelliteProjection({
    odooPartnerId,
    email: normalized,
    firstName: profile?.firstName?.trim() || undefined,
    lastName: profile?.lastName?.trim() || undefined,
    phone: profile?.phone?.trim() || undefined,
    shippingAddressJson,
    clearLocalPassword: true,
  })

  const hydrated = await hydrateUserBusinessFromOdoo(satellite, ctx, { account, force: true })
  return authService.establishLoggedInSession({
    user: hydrated,
    sessionId,
    odooPartnerId,
    odooUid,
  })
}

/**
 * Proiezione satellite da portal Odoo (es. reset password). Solo se Odoo trova il portal.
 * Non inventa identità PWA se Odoo non ha l'account.
 */
export async function ensureSatelliteFromOdooPortal(
  ctx: OdooCallContext,
  email: string,
): Promise<boolean> {
  const normalized = normalizeEmail(email)
  if (!env.ODOO_ENABLED || !isOdooConfigured()) return false

  const portal = await findOdooPortalUserByEmail(ctx, normalized)
  if (!portal) return false

  const account = await customerAdapter.getCustomerAccountByPartnerId(ctx, portal.odooPartnerId)
  const profile = account?.profile ?? null

  const shippingAddressJson = isUsableShippingStreet(profile?.line1)
    ? {
        firstName: profile!.firstName,
        lastName: profile!.lastName,
        line1: profile!.line1,
        line2: profile!.line2 ?? '',
        city: profile!.city,
        postalCode: profile!.postalCode,
        province: profile!.province,
        country: profile!.country,
        phone: profile!.phone ?? '',
      }
    : undefined

  const satellite = await ensureSatelliteProjection({
    odooPartnerId: portal.odooPartnerId,
    email: normalized,
    firstName: profile?.firstName?.trim() || undefined,
    lastName: profile?.lastName?.trim() || undefined,
    phone: profile?.phone?.trim() || undefined,
    shippingAddressJson,
    clearLocalPassword: true,
  })

  await hydrateUserBusinessFromOdoo(satellite, ctx, { account, force: true })
  return true
}

/** @deprecated Alias di ensureSatelliteFromOdooPortal. */
export async function ensurePwaUserStubFromOdoo(
  ctx: OdooCallContext,
  email: string,
): Promise<boolean> {
  return ensureSatelliteFromOdooPortal(ctx, email)
}

/**
 * Dopo ordine guest: provision portal Odoo, poi satellite (senza password locale come auth).
 * Credenziali inviate solo se il portal è stato creato ora.
 */
export async function provisionOdooAccountAfterOrder(
  ctx: OdooCallContext,
  input: {
    orderId: string
    email: string
    odooPartnerId: number | null
    shippingProfile: OdooCustomerProfile | null
    sessionId: string | null
  },
): Promise<void> {
  const normalized = normalizeEmail(input.email)

  const name =
    [input.shippingProfile?.firstName, input.shippingProfile?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || normalized

  let odooPartnerId = input.odooPartnerId
  if (!odooPartnerId && env.ODOO_ENABLED && isOdooConfigured()) {
    const partner = await customerAdapter.findCustomerByEmail(ctx, normalized)
    odooPartnerId = partner?.odooPartnerId ?? null
  }

  if (!odooPartnerId || !isOdooAuthIdentityRequired()) {
    // Senza partner Odoo non materializziamo identità PWA standalone.
    logger.warn('odoo.provision_after_order.skipped_no_partner', {
      correlationId: ctx.correlationId,
      orderId: input.orderId,
      email: normalized,
    })
    return
  }

  const plainPassword = generateAccountPassword()
  let odooUserCreated = false
  let odooUid: number | null = null

  try {
    const portal = await ensureOdooPortalUser(ctx, {
      email: normalized,
      partnerId: odooPartnerId,
      name,
      password: plainPassword,
    })
    odooUserCreated = portal.created
    odooUid = portal.odooUserId
  } catch (e) {
    logger.error('odoo.provision_after_order.portal_failed', {
      correlationId: ctx.correlationId,
      orderId: input.orderId,
      error: e instanceof Error ? e.message : String(e),
    })
    return
  }

  await ensureSatelliteProjection({
    odooPartnerId,
    email: normalized,
    firstName: input.shippingProfile?.firstName?.trim() || undefined,
    lastName: input.shippingProfile?.lastName?.trim() || undefined,
    phone: input.shippingProfile?.phone?.trim() || undefined,
    clearLocalPassword: true,
  })

  if (input.sessionId) {
    await authRepository.linkSessionToIdentity(input.sessionId, {
      odooPartnerId,
      odooUid,
      expiresAt: sessionExpiry(),
    })
    await mergeCartsForUser(input.sessionId, odooPartnerId)
  }

  if (odooUserCreated) {
    const loginUrl = publicAppUrl('/login')
    const firstName = input.shippingProfile?.firstName?.trim()
    await sendPwaMail(ctx, {
      templateKey: 'account_credentials',
      emailTo: normalized,
      vars: {
        first_name_suffix: firstName ? ` ${firstName}` : '',
        intro: 'Abbiamo creato il tuo account sul portale Idea di Luce (sincronizzato con Odoo).',
        email: normalized,
        password: plainPassword,
        login_url: loginUrl,
      },
    })
  }
}
