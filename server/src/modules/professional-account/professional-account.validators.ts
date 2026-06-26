import { z } from 'zod'

export const professionalAccountRequestSchema = z
  .object({
    companyName: z.string().trim().min(2).max(200),
    vatNumber: z.string().trim().min(8).max(20),
    sector: z.string().trim().min(2).max(80),
    sectorOther: z.string().trim().max(200).optional(),
    contactName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).optional(),
    pec: z.string().trim().max(120).optional(),
    sdiCode: z.string().trim().max(20).optional(),
    visuraNote: z.string().trim().max(500).optional(),
    message: z.string().trim().max(2000).optional(),
    locale: z.string().trim().max(5).optional(),
    country: z.string().trim().length(2).optional(),
  })
  .refine((data) => data.sector !== 'Altro' || Boolean(data.sectorOther?.trim()), {
    message: 'Specifica il settore in "Altro"',
    path: ['sectorOther'],
  })

export type ProfessionalAccountRequestInput = z.infer<typeof professionalAccountRequestSchema>
