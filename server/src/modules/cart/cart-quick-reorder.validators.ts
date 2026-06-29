import { z } from 'zod'

export const quickReorderSchema = z
  .object({
    text: z.string().min(1).optional(),
    lines: z
      .array(
        z.object({
          code: z.string().min(1),
          quantity: z.coerce.number().int().min(1).default(1),
        }),
      )
      .min(1)
      .optional(),
    locale: z.string().optional(),
  })
  .refine((body) => Boolean(body.text?.trim()) || (body.lines?.length ?? 0) > 0, {
    message: 'Inserisci almeno un codice prodotto.',
  })

export const resolveCodesSchema = quickReorderSchema
