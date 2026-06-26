import type { CustomerSegment, TaxRule } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export type TaxRuleInput = {
  priority: number
  customerSegment?: CustomerSegment | null
  isProfessional?: boolean | null
  billingCountry?: string | null
  shippingCountry: string
  vatValid?: boolean | null
  taxRatePct: number
  taxLabel: string
  disclaimerKey?: string | null
  odooFiscalPositionId?: number | null
  enabled?: boolean
}

function toDecimal(rate: number) {
  return new Prisma.Decimal(rate)
}

export const taxRepository = {
  async listEnabled(): Promise<TaxRule[]> {
    return prisma.taxRule.findMany({
      where: { enabled: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    })
  },

  async listAll(): Promise<TaxRule[]> {
    return prisma.taxRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    })
  },

  async findById(id: string): Promise<TaxRule | null> {
    return prisma.taxRule.findUnique({ where: { id } })
  },

  async create(input: TaxRuleInput): Promise<TaxRule> {
    return prisma.taxRule.create({
      data: {
        priority: input.priority,
        customerSegment: input.customerSegment ?? undefined,
        isProfessional: input.isProfessional ?? undefined,
        billingCountry: input.billingCountry?.trim().toUpperCase() ?? undefined,
        shippingCountry: input.shippingCountry.trim().toUpperCase(),
        vatValid: input.vatValid ?? undefined,
        taxRatePct: toDecimal(input.taxRatePct),
        taxLabel: input.taxLabel.trim(),
        disclaimerKey: input.disclaimerKey?.trim() || undefined,
        odooFiscalPositionId: input.odooFiscalPositionId ?? undefined,
        enabled: input.enabled ?? true,
      },
    })
  },

  async update(id: string, input: Partial<TaxRuleInput>): Promise<TaxRule> {
    return prisma.taxRule.update({
      where: { id },
      data: {
        ...(input.priority != null ? { priority: input.priority } : {}),
        ...(input.customerSegment !== undefined ? { customerSegment: input.customerSegment } : {}),
        ...(input.isProfessional !== undefined ? { isProfessional: input.isProfessional } : {}),
        ...(input.billingCountry !== undefined
          ? { billingCountry: input.billingCountry?.trim().toUpperCase() ?? null }
          : {}),
        ...(input.shippingCountry != null
          ? { shippingCountry: input.shippingCountry.trim().toUpperCase() }
          : {}),
        ...(input.vatValid !== undefined ? { vatValid: input.vatValid } : {}),
        ...(input.taxRatePct != null ? { taxRatePct: toDecimal(input.taxRatePct) } : {}),
        ...(input.taxLabel != null ? { taxLabel: input.taxLabel.trim() } : {}),
        ...(input.disclaimerKey !== undefined
          ? { disclaimerKey: input.disclaimerKey?.trim() || null }
          : {}),
        ...(input.odooFiscalPositionId !== undefined
          ? { odooFiscalPositionId: input.odooFiscalPositionId }
          : {}),
        ...(input.enabled != null ? { enabled: input.enabled } : {}),
      },
    })
  },

  async delete(id: string): Promise<TaxRule> {
    return prisma.taxRule.delete({ where: { id } })
  },

  async count(): Promise<number> {
    return prisma.taxRule.count()
  },
}
