import { z } from 'zod'

export const socialProofSettingsPatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    minQuantity: z.coerce.number().int().min(1).max(10_000).optional(),
    lookbackDays: z.coerce.number().int().min(1).max(365).optional(),
    maxEvents: z.coerce.number().int().min(1).max(50).optional(),
    odooImportEnabled: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nessun campo da aggiornare' })
