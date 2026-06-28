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

function sessionExpiry(): Date {
  return new Date(Date.now() + env.SESSION_DAYS * 24 * 60 * 60 * 1000)
}

export { sessionExpiry }


async function mergeCartsForUser(sessionId: string, userId: string) {
  await prisma.cart.updateMany({
    where: { sessionId, userId: null, status: 'ACTIVE' },
    data: { userId },
  })

  const carts = await prisma.cart.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ userId }, { sessionId }],
    },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  })
  const unique = [...new Map(carts.map((c) => [c.id, c])).values()]
  if (unique.length <= 1) return

  const [primary, ...rest] = unique
  await prisma.$transaction(async (tx) => {
    for (const other of rest) {
      for (const line of other.items) {
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId: primary.id,
            productRef: line.productRef,
            variantRef: line.variantRef ?? null,
          },
        })
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + line.quantity },
          })
        } else {
          await tx.cartItem.create({
            data: {
              cartId: primary.id,
              productRef: line.productRef,
              variantRef: line.variantRef,
              quantity: line.quantity,
              clientUnitPriceEstimate: line.clientUnitPriceEstimate,
              metadataJson: line.metadataJson ?? undefined,
            },
          })
        }
      }
      await tx.cart.delete({ where: { id: other.id } })
    }
    const merged = await tx.cart.findUnique({
      where: { id: primary.id },
      include: { items: true },
    })
    if (merged) {
      await bumpCartReservation(primary.id, merged.items.length > 0)
    }
  })
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

  await prisma.$transaction(async (tx) => {
    for (const item of sessionItems) {
      const variantRef = item.variantRef ?? null
      const existing = await tx.wishlistItem.findFirst({
        where: { userId, productRef: item.productRef, variantRef },
      })
      if (!existing) {
        await tx.wishlistItem.create({
          data: { userId, productRef: item.productRef, variantRef },
        })
      }
      await tx.wishlistItem.delete({ where: { id: item.id } })
    }
  })
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
