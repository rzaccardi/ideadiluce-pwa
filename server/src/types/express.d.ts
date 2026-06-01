import type { Session, User } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      correlationId: string
      /** Presente dopo il middleware sessione su /api/v1 */
      sessionRecord?: Session & { user: User | null }
      sessionTokenRaw?: string | null
    }
  }
}

export {}
