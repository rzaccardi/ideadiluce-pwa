import { z } from 'zod'

export const siteInquirySchema = z.object({
  kind: z.enum(['product-not-found', 'contact', 'b2b', 'professional-quote']),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().max(4000).optional(),
  productCode: z.string().trim().max(120).optional(),
  brand: z.string().trim().max(120).optional(),
  quantity: z.coerce.number().int().min(1).max(9999).optional(),
  locale: z.string().trim().max(5).optional(),
})

export type SiteInquiryInput = z.infer<typeof siteInquirySchema>
