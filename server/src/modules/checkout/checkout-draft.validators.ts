import { z } from 'zod'
import {
  checkoutStartBodySchema,
  checkoutStartSchema,
  type CheckoutBusinessFields,
} from './checkout.validators.js'
import { checkoutAddressSchema } from './checkout-address.validators.js'

const optionalCheckoutEmail = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .pipe(z.string().email().optional())

const checkoutDraftFields = checkoutStartBodySchema
  .omit({ email: true })
  .extend({
    email: optionalCheckoutEmail,
    step: z.enum(['details', 'shipping', 'payment_method', 'lock']),
    orderId: z.string().min(1).optional(),
    paymentMethod: z.enum(['card_nexi', 'bank_transfer', 'paypal', 'google_pay', 'stripe']).optional(),
  })

function validateDraftStep(
  data: z.infer<typeof checkoutDraftFields> & {
    billingAddress?: z.infer<typeof checkoutAddressSchema>
    shippingAddress?: z.infer<typeof checkoutAddressSchema>
    business?: CheckoutBusinessFields
  },
  ctx: z.RefinementCtx,
) {
  const billing = data.billingAddress
  const shipping = data.shippingAddress

  if (data.step === 'details') {
    if (!data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Email obbligatoria.',
      })
    }
    if (!billing || !shipping) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['billingAddress'],
        message: 'Indirizzi di fatturazione e spedizione obbligatori.',
      })
      return
    }

    const full = checkoutStartSchema.safeParse({
      email: data.email,
      billingAddress: billing,
      shippingAddress: shipping,
      customerSegment: data.customerSegment,
      isProfessional: data.isProfessional,
      business: data.business,
      vatValidated: data.vatValidated,
      vatForceAccepted: data.vatForceAccepted,
      clientOrderRef: data.clientOrderRef,
      orderNotes: data.orderNotes,
      deliveryRecipient: data.deliveryRecipient ?? data.dropshipAddress,
      dropshipAddress: data.dropshipAddress,
      createAccount: data.createAccount,
      idempotencyKey: data.idempotencyKey,
      lockPrices: data.lockPrices,
    })
    if (!full.success) {
      for (const issue of full.error.issues) {
        ctx.addIssue(issue)
      }
    }
    return
  }

  if (data.step === 'shipping' || data.step === 'payment_method' || data.step === 'lock') {
    if (!data.email && !data.orderId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Email obbligatoria.',
      })
    }
    if (!billing || !shipping) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['billingAddress'],
        message: 'Indirizzi di fatturazione e spedizione obbligatori.',
      })
    }
    if (data.step === 'payment_method' && !data.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentMethod'],
        message: 'Metodo di pagamento obbligatorio.',
      })
    }
  }
}

export const checkoutDraftSchema = checkoutDraftFields.superRefine(validateDraftStep)

export type CheckoutDraftBody = z.infer<typeof checkoutDraftSchema>
