import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { bumpCartReservation } from '../cart/cart.reservation.js'
import { env } from '../../config/env.js'
import { AppError } from '../../types/errors.js'
import type { UserDTO } from '../../types/dto.js'
import type { CustomerSegment, User } from '@prisma/client'
import { authRepository } from './auth.repository.js'
import { generateSessionToken, hashSessionToken } from '../../lib/token-hash.js'
import { toUserDTO } from '../users/user.mapper.js'
import { loginWithOdooCredentials } from './odoo-account-sync.service.js'
import { linkOrdersToUser } from '../orders/orders-user-link.service.js'
import { absorbCartLines, cartLineKey, type MergedCartLine } from './cart-merge.js'

function sessionExpiry(): Date {
  return new Date(Date.now() + env.SESSION_DAYS * 24 * 60 * 60 * 1000)
}

export { sessionExpiry }

const AUTH_MERGE_TRANSACTION = { timeout: 15_000 } as const

/** Unisce il carrello guest della sessione corrente con eventuali carrelli ACTIVE già salvati sull'utente. */
export async function mergeCartsForUser(sessionId: string, userId: string) {
  await prisma.cart.updateMany({
    where: { sessionId, userId: null, status: 'ACTIVE' },
    data: { userId },
  })

  const carts = await prisma.cart.findMany({
    where: { status: 'ACTIVE', userId },
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

/** Al logout: il carrello dell'utente resta sulla nuova sessione guest (stesso id, senza userId). */
async function detachUserCartToGuestSession(userId: string, guestSessionId: string) {
  const cart = await prisma.cart.findFirst({
    where: { userId, status: 'ACTIVE' },
    select: { id: true },
  })
  if (!cart) return

  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      sessionId: guestSessionId,
      userId: null,
    },
  })
}

async function mergeOrdersForUser(sessionId: string, userId: string, email: string) {
  await linkOrdersToUser({ userId, email, sessionId })
}

async function mergeWishlistForUser(sessionId: string, userId: string) {
  const sessionItems = await prisma.wishlistItem.findMany({ where: { sessionId } })
  if (sessionItems.length === 0) return

  const userItems = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productRef: true, variantRef: true },
  })
  const userKeys = new Set(userItems.map((item) => cartLineKey(item.productRef, item.variantRef)))
  const toCreate = sessionItems.filter(
    (item) => !userKeys.has(cartLineKey(item.productRef, item.variantRef)),
  )

  await prisma.$transaction(
    async (tx) => {
      if (toCreate.length > 0) {
        await tx.wishlistItem.createMany({
          data: toCreate.map((item) => ({
            userId,
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
  async register(
    input: {
      email: string
      password: string
      firstName?: string
      lastName?: string
      phone?: string
      customerSegment?: 'retail' | 'business'
    },
    sessionId: string,
  ): Promise<UserDTO> {
    const existing = await authRepository.findUserByEmail(input.email)
    if (existing) {
      throw new AppError(
        'EMAIL_TAKEN',
        'Email already registered',
        'Questa email è già in uso.',
        409,
        false,
      )
    }
    const passwordHash = bcrypt.hashSync(input.password, 10)
    const segment: CustomerSegment =
      input.customerSegment === 'business' ? 'BUSINESS' : 'RETAIL'
    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      customerSegment: segment,
    })
    await authRepository.linkSessionToUser(sessionId, user.id, sessionExpiry())
    await mergeCartsForUser(sessionId, user.id)
    await mergeWishlistForUser(sessionId, user.id)
    await mergeOrdersForUser(sessionId, user.id, user.email)
    const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    return await toUserDTO(fresh)
  },

  async login(
    input: { email: string; password: string },
    sessionId: string,
    correlationId?: string,
  ): Promise<UserDTO> {
    const user = await authRepository.findUserByEmail(input.email)
    if (user?.passwordHash) {
      const ok = bcrypt.compareSync(input.password, user.passwordHash)
      if (ok) {
        await authRepository.linkSessionToUser(sessionId, user.id, sessionExpiry())
        await mergeCartsForUser(sessionId, user.id)
        await mergeWishlistForUser(sessionId, user.id)
        await mergeOrdersForUser(sessionId, user.id, user.email)
        const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
        return await toUserDTO(fresh)
      }
    }

    if (correlationId && env.ODOO_ENABLED) {
      const odooUser = await loginWithOdooCredentials(
        { correlationId },
        input.email,
        input.password,
        sessionId,
      )
      if (odooUser) return odooUser
    }

    throw new AppError(
      'INVALID_CREDENTIALS',
      'Invalid login',
      'Email o password non corretti.',
      401,
      false,
    )
  },

  async loginByVerifiedEmail(email: string, sessionId: string): Promise<UserDTO> {
    const user = await authRepository.findUserByEmail(email)
    if (!user?.passwordHash) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        'Invalid login',
        'Email o password non corretti.',
        401,
        false,
      )
    }
    await authRepository.linkSessionToUser(sessionId, user.id, sessionExpiry())
    await mergeCartsForUser(sessionId, user.id)
    await mergeWishlistForUser(sessionId, user.id)
    await mergeOrdersForUser(sessionId, user.id, user.email)
    const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    return await toUserDTO(fresh)
  },

  async logout(sessionId: string | undefined, rawToken: string | null | undefined) {
    let userId: string | null = null
    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { userId: true },
      })
      userId = session?.userId ?? null
    }

    if (rawToken) {
      await authRepository.deleteSessionByTokenHash(hashSessionToken(rawToken))
    } else if (sessionId) {
      await prisma.session.deleteMany({ where: { id: sessionId } })
    }

    const guest = await this.issueNewGuestSession()
    if (userId) {
      await detachUserCartToGuestSession(userId, guest.sessionId)
    }
    return guest
  },

  async me(user: User): Promise<UserDTO> {
    return toUserDTO(user)
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
