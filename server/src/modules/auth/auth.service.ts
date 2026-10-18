import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { bumpCartReservation } from '../cart/cart.reservation.js'
import { env } from '../../config/env.js'
import { AppError } from '../../types/errors.js'
import type { UserDTO } from '../../types/dto.js'
import type { CustomerSatellite, CustomerSegment } from '@prisma/client'
import { authRepository } from './auth.repository.js'
import { generateSessionToken, hashSessionToken } from '../../lib/token-hash.js'
import { toUserDTO } from '../users/user.mapper.js'
import {
  assertOdooAuthReadyForIdentity,
  isOdooAuthIdentityRequired,
  loginWithOdooCredentials,
  provisionOdooAuthIdentity,
} from './odoo-account-sync.service.js'
import { ensureSatelliteProjection } from './satellite-projection.service.js'
import { hydrateUserBusinessFromOdoo } from '../users/users-odoo-business-hydrate.js'
import { linkOrdersToUser } from '../orders/orders-user-link.service.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { absorbCartLines, cartLineKey, type MergedCartLine } from './cart-merge.js'
import { sendPwaMail, PWA_ADMIN_MAIL_TO } from '../../adapters/odoo/odooMailAdapter.js'
import { publicAppUrl } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'

function sessionExpiry(): Date {
  return new Date(Date.now() + env.SESSION_DAYS * 24 * 60 * 60 * 1000)
}

export { sessionExpiry }

const AUTH_MERGE_TRANSACTION = { timeout: 15_000 } as const

/** Unisce il carrello guest della sessione corrente con eventuali carrelli ACTIVE del partner. */
export async function mergeCartsForUser(sessionId: string, odooPartnerId: number) {
  await prisma.cart.updateMany({
    where: { sessionId, odooPartnerId: null, status: 'ACTIVE' },
    data: { odooPartnerId },
  })

  // Non mescolare righe di un bonifico già inviato (PAYMENT_PENDING) nel carrello shopping.
  const { detachActiveCartsBoundToPendingBankTransfer } = await import(
    '../cart/cart-bank-transfer-guard.js'
  )
  await detachActiveCartsBoundToPendingBankTransfer(odooPartnerId)

  const carts = await prisma.cart.findMany({
    where: { status: 'ACTIVE', odooPartnerId },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  })
  if (carts.length <= 1) {
    const only = carts[0]
    if (only && only.sessionId !== sessionId) {
      await prisma.cart.update({
        where: { id: only.id },
        data: { sessionId },
      })
    }
    return
  }

  const [primary, ...rest] = carts
  const merged = new Map<string, MergedCartLine>()
  absorbCartLines(merged, primary.items)
  for (const other of rest) {
    absorbCartLines(merged, other.items)
  }

  const restIds = rest.map((cart) => cart.id)
  await prisma.$transaction(
    async (tx) => {
      if (restIds.length > 0) {
        await tx.cart.deleteMany({ where: { id: { in: restIds } } })
      }
      await tx.cartItem.deleteMany({ where: { cartId: primary.id } })
      const lines = [...merged.values()]
      if (lines.length > 0) {
        await tx.cartItem.createMany({
          data: lines.map((line) => ({
            cartId: primary.id,
            productRef: line.productRef,
            variantRef: line.variantRef,
            quantity: line.quantity,
            clientUnitPriceEstimate: line.clientUnitPriceEstimate,
            metadataJson: line.metadataJson ?? undefined,
          })),
        })
      }
      await tx.cart.update({
        where: { id: primary.id },
        data: { sessionId },
      })
    },
    AUTH_MERGE_TRANSACTION,
  )

  await bumpCartReservation(primary.id, merged.size > 0)
}

/** Al logout: il carrello resta sulla nuova sessione guest (stesso id, senza odooPartnerId). */
async function detachPartnerCartToGuestSession(odooPartnerId: number, guestSessionId: string) {
  const cart = await prisma.cart.findFirst({
    where: { odooPartnerId, status: 'ACTIVE' },
    select: { id: true },
  })
  if (!cart) return

  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      sessionId: guestSessionId,
      odooPartnerId: null,
    },
  })
}

async function mergeOrdersForPartner(sessionId: string, odooPartnerId: number, email: string) {
  await linkOrdersToUser({ odooPartnerId, email, sessionId })
}

async function mergeWishlistForPartner(sessionId: string, odooPartnerId: number) {
  const sessionItems = await prisma.wishlistItem.findMany({ where: { sessionId } })
  if (sessionItems.length === 0) return

  const partnerItems = await prisma.wishlistItem.findMany({
    where: { odooPartnerId },
    select: { productRef: true, variantRef: true },
  })
  const partnerKeys = new Set(
    partnerItems.map((item) => cartLineKey(item.productRef, item.variantRef)),
  )
  const toCreate = sessionItems.filter(
    (item) => !partnerKeys.has(cartLineKey(item.productRef, item.variantRef)),
  )

  await prisma.$transaction(
    async (tx) => {
      if (toCreate.length > 0) {
        await tx.wishlistItem.createMany({
          data: toCreate.map((item) => ({
            odooPartnerId,
            productRef: item.productRef,
            variantRef: item.variantRef,
          })),
        })
      }
      await tx.wishlistItem.deleteMany({ where: { sessionId } })
    },
    AUTH_MERGE_TRANSACTION,
  )
}

export const authService = {
  /**
   * Dopo auth/provision Odoo: collega sessione all'identità Odoo + hub satellite FK.
   * Non risolve mai identità per email.
   */
  async establishLoggedInSession(params: {
    user: CustomerSatellite
    sessionId: string
    odooPartnerId?: number | null
    odooUid?: number | null
  }): Promise<UserDTO> {
    const { user, sessionId, odooUid } = params
    const partnerId = params.odooPartnerId ?? user.odooPartnerId
    if (partnerId == null) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        'Missing odooPartnerId on satellite',
        'Account non collegato a Odoo.',
        401,
        false,
      )
    }
    await authRepository.linkSessionToIdentity(sessionId, {
      odooPartnerId: partnerId,
      odooUid: odooUid ?? null,
      expiresAt: sessionExpiry(),
    })
    await mergeCartsForUser(sessionId, partnerId)
    await mergeWishlistForPartner(sessionId, partnerId)
    await mergeOrdersForPartner(sessionId, partnerId, user.email)
    return toUserDTO(user)
  },

  async register(
    input: {
      email: string
      password: string
      firstName?: string
      lastName?: string
      phone?: string
      customerSegment?: 'retail' | 'business'
      companyName?: string
      vatNumber?: string
    },
    sessionId: string,
    correlationId?: string,
  ): Promise<UserDTO> {
    const segment: CustomerSegment =
      input.customerSegment === 'business' ? 'BUSINESS' : 'RETAIL'
    if (segment === 'BUSINESS') {
      if (!input.companyName?.trim() || !input.vatNumber?.trim()) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Business registration requires company name and VAT',
          'Per un account azienda sono obbligatori ragione sociale e Partita IVA.',
          400,
          false,
        )
      }
    }

    assertOdooAuthReadyForIdentity()
    const mailCtx = { correlationId: correlationId ?? `register:${input.email}` }
    const odooRequired = isOdooAuthIdentityRequired()

    // Con Odoo: EMAIL_TAKEN solo da portal (provision). Mai findUserByEmail come autorità.
    if (!odooRequired) {
      const existing = await authRepository.findSatelliteByEmail(input.email)
      if (existing) {
        throw new AppError(
          'EMAIL_TAKEN',
          'Email already registered',
          'Questa email è già in uso.',
          409,
          false,
        )
      }
    }

    let odooPartnerId: number | null = null
    let odooUid: number | null = null
    if (odooRequired) {
      const odoo = await provisionOdooAuthIdentity(mailCtx, {
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        business:
          segment === 'BUSINESS'
            ? {
                companyName: input.companyName,
                vatNumber: input.vatNumber,
                isCompany: true,
              }
            : undefined,
      })
      odooPartnerId = odoo.odooPartnerId
      odooUid = odoo.odooUserId
    }

    let user: CustomerSatellite
    if (odooPartnerId) {
      user = await ensureSatelliteProjection({
        odooPartnerId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        customerSegment: segment,
        companyName: segment === 'BUSINESS' ? input.companyName : undefined,
        vatNumber: segment === 'BUSINESS' ? input.vatNumber : undefined,
        clearLocalPassword: true,
      })
    } else {
      // Path locale (ODOO_ENABLED=false / XML-RPC assente): satellite con password solo per dev.
      const passwordHash = bcrypt.hashSync(input.password, 10)
      user = await authRepository.createUser({
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        customerSegment: segment,
        companyName: segment === 'BUSINESS' ? input.companyName : undefined,
        vatNumber: segment === 'BUSINESS' ? input.vatNumber : undefined,
      })
    }

    const dto = await this.establishLoggedInSession({
      user,
      sessionId,
      odooPartnerId,
      odooUid,
    })

    const firstNameSuffix = user.firstName?.trim() ? ` ${user.firstName.trim()}` : ''
    // Non bloccare la risposta HTTP sulla mail Odoo (SMTP/XML-RPC può superare i timeout edge).
    void (async () => {
      try {
        await sendPwaMail(mailCtx, {
          templateKey: 'account_welcome',
          emailTo: user.email,
          vars: {
            first_name_suffix: firstNameSuffix,
            email: user.email,
            login_url: publicAppUrl('/login'),
          },
        })
        if (segment === 'BUSINESS') {
          await sendPwaMail(mailCtx, {
            templateKey: 'business_registration_admin',
            emailTo: PWA_ADMIN_MAIL_TO,
            vars: {
              customer_email: user.email,
              body_text: [
                `Nuova registrazione azienda da /register`,
                `Email: ${user.email}`,
                `Nome: ${[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}`,
                `Telefono: ${user.phone ?? '-'}`,
                `Ragione sociale: ${user.companyName ?? '-'}`,
                `P.IVA: ${user.vatNumber ?? '-'}`,
                odooPartnerId ? `Partner Odoo: #${odooPartnerId}` : null,
              ]
                .filter(Boolean)
                .join('\n'),
            },
          })
        }
      } catch (e) {
        logger.warn('auth.register.welcome_mail_failed', {
          correlationId: mailCtx.correlationId,
          userId: user.id,
          odooPartnerId,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    })()

    return dto
  },

  async login(
    input: { email: string; password: string },
    sessionId: string,
    correlationId?: string,
  ): Promise<UserDTO> {
    const ctxCorrelationId = correlationId ?? `login:${input.email.toLowerCase().trim()}`

    // Odoo-first: se Odoo è richiesto, SOLO portal. Nessun fallback bcrypt / find locale.
    if (isOdooAuthIdentityRequired()) {
      const odooUser = await loginWithOdooCredentials(
        { correlationId: ctxCorrelationId },
        input.email,
        input.password,
        sessionId,
      )
      if (odooUser) return odooUser
      throw new AppError(
        'INVALID_CREDENTIALS',
        'Invalid login',
        'Email o password non corretti.',
        401,
        false,
      )
    }

    // Path degradato: ODOO_ENABLED=false → bcrypt locale (solo satellite/dev).
    const user = await authRepository.findSatelliteByEmail(input.email)
    if (user?.passwordHash) {
      const ok = bcrypt.compareSync(input.password, user.passwordHash)
      if (ok) {
        const hydrated = await hydrateUserBusinessFromOdoo(user, {
          correlationId: ctxCorrelationId,
        })
        return this.establishLoggedInSession({
          user: hydrated,
          sessionId,
          odooPartnerId: hydrated.odooPartnerId,
        })
      }
    }

    throw new AppError(
      'INVALID_CREDENTIALS',
      'Invalid login',
      'Email o password non corretti.',
      401,
      false,
    )
  },

  /**
   * Stabilisce sessione dopo che Odoo ha già verificato l'identità (checkout register, ecc.).
   * Non autentica: richiede proiezione satellite già presente.
   */
  async loginByVerifiedEmail(
    email: string,
    sessionId: string,
    odoo?: { odooPartnerId?: number | null; odooUid?: number | null },
  ): Promise<UserDTO> {
    const user = await authRepository.findSatelliteByEmail(email)
    if (!user) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        'Invalid login',
        'Email o password non corretti.',
        401,
        false,
      )
    }
    if (isOdooAuthIdentityRequired() && !user.odooPartnerId && !odoo?.odooPartnerId) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        'No Odoo identity on satellite',
        'Account non collegato a Odoo. Accedi con le credenziali del portale.',
        401,
        false,
      )
    }
    const fresh = await prisma.customerSatellite.findUniqueOrThrow({ where: { id: user.id } })
    const hydrated = await hydrateUserBusinessFromOdoo(fresh, {
      correlationId: `login:${user.id}`,
    })
    return this.establishLoggedInSession({
      user: hydrated,
      sessionId,
      odooPartnerId: odoo?.odooPartnerId ?? hydrated.odooPartnerId,
      odooUid: odoo?.odooUid ?? null,
    })
  },

  async logout(sessionId: string | undefined, rawToken: string | null | undefined) {
    let odooPartnerId: number | null = null
    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { odooPartnerId: true },
      })
      odooPartnerId = session?.odooPartnerId ?? null
    }

    if (rawToken) {
      await authRepository.deleteSessionByTokenHash(hashSessionToken(rawToken))
    } else if (sessionId) {
      await prisma.session.deleteMany({ where: { id: sessionId } })
    }

    const guest = await this.issueNewGuestSession()
    if (odooPartnerId != null) {
      await detachPartnerCartToGuestSession(odooPartnerId, guest.sessionId)
    }
    return guest
  },

  async me(user: CustomerSatellite, ctx?: OdooCallContext): Promise<UserDTO> {
    const hydrated = await hydrateUserBusinessFromOdoo(user, ctx)
    return toUserDTO(hydrated)
  },

  async issueNewGuestSession(): Promise<{ token: string; sessionId: string }> {
    const token = generateSessionToken()
    const session = await prisma.session.create({
      data: {
        tokenHash: hashSessionToken(token),
        expiresAt: sessionExpiry(),
      },
    })
    return { token, sessionId: session.id }
  },

  /** Ruota il token di sessione e prolunga la scadenza (stesso `session.id`, carrello invariato). */
  async refreshSession(sessionId: string): Promise<{ token: string; expiresAt: Date }> {
    const row = await prisma.session.findUnique({ where: { id: sessionId } })
    if (!row || row.expiresAt < new Date()) {
      throw new AppError(
        'UNAUTHORIZED',
        'Session expired',
        'Sessione scaduta. Effettua di nuovo il login.',
        401,
        false,
      )
    }

    const token = generateSessionToken()
    const expiresAt = sessionExpiry()
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        tokenHash: hashSessionToken(token),
        expiresAt,
      },
    })
    return { token, expiresAt }
  },
}
