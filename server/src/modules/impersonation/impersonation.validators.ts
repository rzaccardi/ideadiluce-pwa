import { z } from 'zod'

export const impersonationExchangeBodySchema = z.object({
  token: z.string().min(1),
})
