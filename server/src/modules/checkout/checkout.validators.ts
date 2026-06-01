import { z } from 'zod'

export const createCheckoutSessionSchema = z.object({
  email: z.string().email(),
})
