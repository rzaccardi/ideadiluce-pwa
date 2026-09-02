import { z } from 'zod'

export const orderReturnRequestBodySchema = z.object({
  notes: z.string().trim().max(2000).optional(),
  locale: z.string().trim().max(5).optional(),
})

export type OrderReturnRequestBody = z.infer<typeof orderReturnRequestBodySchema>
