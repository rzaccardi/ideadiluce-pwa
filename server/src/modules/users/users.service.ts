import { prisma } from '../../lib/prisma.js'
import type { UserDTO } from '../../types/dto.js'
import type { User } from '@prisma/client'

function toDTO(u: User): UserDTO {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    status: u.status,
  }
}

export const usersService = {
  async patchMe(
    userId: string,
    input: { firstName?: string; lastName?: string; phone?: string | null },
  ): Promise<UserDTO> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      },
    })
    return toDTO(user)
  },
}
