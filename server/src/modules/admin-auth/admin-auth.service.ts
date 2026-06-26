import bcrypt from 'bcryptjs'
import type { AdminUser } from '@prisma/client'
import {
  getOdooProductActionId,
  getOdooWebBaseUrlOrNull,
  isOdooConfigured,
} from '../../adapters/odoo/odooClient.js'
import { AppError } from '../../types/errors.js'
import { generateSessionToken, hashSessionToken } from '../../lib/token-hash.js'
import { adminSessionExpiry } from '../../middlewares/admin-session.js'
import { adminAuthRepository } from './admin-auth.repository.js'

export type AdminUserDTO = {
  id: string
  email: string
  displayName: string | null
}

export type AdminWorkspaceConfigDTO = {
  odooWebBaseUrl: string | null
  odooProductActionId: number | null
}

function toAdminUserDTO(user: AdminUser): AdminUserDTO {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  }
}

function workspaceConfig(): AdminWorkspaceConfigDTO {
  return {
    odooWebBaseUrl: getOdooWebBaseUrlOrNull(),
    odooProductActionId: isOdooConfigured() ? getOdooProductActionId() : null,
  }
}

export const adminAuthService = {
  toAdminUserDTO,
  workspaceConfig,

  async login(input: {
    email: string
    password: string
  }): Promise<{ user: AdminUserDTO; workspace: AdminWorkspaceConfigDTO; token: string }> {
    const user = await adminAuthRepository.findUserByEmail(input.email)
    if (!user || user.status !== 'ACTIVE') {
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
    const token = generateSessionToken()
    await adminAuthRepository.createSession(user.id, hashSessionToken(token), adminSessionExpiry())
    return { user: toAdminUserDTO(user), workspace: workspaceConfig(), token }
  },

  async logout(rawToken: string | null | undefined) {
    if (rawToken) {
      await adminAuthRepository.deleteSessionByTokenHash(hashSessionToken(rawToken))
    }
  },

  me(user: AdminUser): AdminUserDTO {
    return toAdminUserDTO(user)
  },
}
