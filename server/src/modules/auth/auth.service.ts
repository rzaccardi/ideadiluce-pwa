import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import { AppError } from '../../types/errors.js'
import type { UserDTO } from '../../types/dto.js'
import { authRepository } from './auth.repository.js'
import { generateSessionToken, hashSessionToken } from '../../lib/token-hash.js'
import type { User } from '@prisma/client'

function sessionExpiry(): Date {
  return new Date(Date.now() + env.SESSION_DAYS * 24 * 60 * 60 * 1000)
}

function toUserDTO(u: User): UserDTO {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    status: u.status,
  }
}

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
    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    })
    await authRepository.linkSessionToUser(sessionId, user.id, sessionExpiry())
    await mergeCartsForUser(sessionId, user.id)
    const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    return toUserDTO(fresh)
  },

  async login(input: { email: string; password: string }, sessionId: string): Promise<UserDTO> {
    const user = await authRepository.findUserByEmail(input.email)
    if (!user?.passwordHash) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        'Invalid login',
        'Email o password non corretti.',
        401,
        false,
      )
    }
    const ok = bcrypt.compareSync(input.password, user.passwordHash)
    if (!ok) {
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
    const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    return toUserDTO(fresh)
  },

  async logout(rawToken: string | null | undefined) {
    if (rawToken) {
      await authRepository.deleteSessionByTokenHash(hashSessionToken(rawToken))
    }
  },

  me(user: User): UserDTO {
    return toUserDTO(user)
  },

  async issueNewGuestSession(): Promise<{ token: string }> {
    const token = generateSessionToken()
    await prisma.session.create({
      data: {
        tokenHash: hashSessionToken(token),
        expiresAt: sessionExpiry(),
      },
    })
    return { token }
  },
}
