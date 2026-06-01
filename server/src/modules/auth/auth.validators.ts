import { z } from 'zod'

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
})

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
