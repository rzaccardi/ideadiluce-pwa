import { z } from 'zod'

export const merchantCenterSettingsPatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    includeOutOfStock: z.boolean().optional(),
    expandVariants: z.boolean().optional(),
    googleProductCategory: z.string().max(180).optional(),
    shippingCountry: z
      .string()
      .trim()
      .length(2)
      .regex(/^[A-Za-z]{2}$/, 'Paese ISO a 2 lettere')
      .optional(),
    shippingPriceCents: z.number().int().min(0).max(1_000_000).nullable().optional(),
    brandFallback: z.string().trim().min(1).max(80).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nessun campo da aggiornare' })
