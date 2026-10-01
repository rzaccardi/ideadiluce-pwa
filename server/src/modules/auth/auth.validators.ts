import { z } from 'zod'
import { isCheckoutPhoneValid } from '../checkout/checkout-address.validators.js'

export const registerBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    /** `business` per account B2B (listino dedicato). */
    customerSegment: z.enum(['retail', 'business']).optional(),
    companyName: z.string().trim().min(1).optional(),
    vatNumber: z.string().trim().min(5).max(32).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.customerSegment !== 'business') return
    if (!data.companyName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: 'Company name required for business accounts',
      })
    }
    if (!data.vatNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vatNumber'],
        message: 'VAT number required for business accounts',
      })
    }
  })

export const forgotPasswordBodySchema = z.object({
  email: z.string().email(),
})

export const checkoutForgotPasswordBodySchema = z.object({
  email: z.string().email(),
})

export const resetPasswordBodySchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8),
})

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const checkoutLoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const checkoutRegisterBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z
    .string()
    .trim()
    .min(1)
    .refine(isCheckoutPhoneValid, { message: 'Invalid phone number' }),
  customerSegment: z.enum(['retail', 'business']).optional(),
})
