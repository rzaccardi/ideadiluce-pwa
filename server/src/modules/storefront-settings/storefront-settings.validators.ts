import { z } from 'zod'

const httpsUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine((value) => {
    try {
      const url = new URL(value)
      return url.protocol === 'https:' && Boolean(url.hostname)
    } catch {
      return false
    }
  }, 'Inserisci un URL HTTPS valido')

export const storefrontSettingsPatchSchema = z
  .object({
    soundsEnabled: z.boolean().optional(),
    legacySiteNoticeEnabled: z.boolean().optional(),
    legacySiteUrl: httpsUrlSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nessun campo da aggiornare' })
