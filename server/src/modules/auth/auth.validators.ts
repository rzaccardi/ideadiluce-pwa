import { z } from 'zod'

const recaptchaTokenField = {
  recaptchaToken: z.string().min(1).optional(),
}

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  /** `business` per account B2B (listino dedicato). */
  customerSegment: z.enum(['retail', 'business']).optional(),
  ...recaptchaTokenField,
})

export const forgotPasswordBodySchema = z.object({
  email: z.string().email(),
})

export const resetPasswordBodySchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8),
})

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  ...recaptchaTokenField,
})

export const checkoutRegisterBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  customerSegment: z.enum(['retail', 'business']).optional(),
  ...recaptchaTokenField,
})
