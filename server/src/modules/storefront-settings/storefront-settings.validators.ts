import { z } from 'zod'

export const storefrontSettingsPatchSchema = z
  .object({
    soundsEnabled: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nessun campo da aggiornare' })
