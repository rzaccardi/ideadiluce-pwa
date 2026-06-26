import { prisma } from '../../lib/prisma.js'
import { hashTaxIdentifier } from './tax-hash.js'
import type { TaxValidationContext, TaxValidationResult } from './tax-validation.types.js'
import { pickViesCompanyName } from './vies-utils.js'

export const taxValidationRepository = {
  async writeLog(
    ctx: TaxValidationContext,
    result: TaxValidationResult,
    provider: 'local' | 'vies',
    status: string,
  ): Promise<void> {
    await prisma.taxValidationLog.create({
      data: {
        userId: ctx.userId ?? null,
        sessionId: ctx.sessionId ?? null,
        fiscalCodeHash: result.fiscalCode?.normalized
          ? hashTaxIdentifier(result.fiscalCode.normalized)
          : null,
        vatCountryCode: result.vat?.countryCode ?? null,
        vatNumberHash: result.vat?.normalized
          ? hashTaxIdentifier(`${result.vat.countryCode}${result.vat.normalized}`)
          : null,
        provider,
        status,
        responseSummary: {
          fiscalCodeValid: result.fiscalCode?.valid ?? null,
          vatFormatValid: result.vat?.formatValid ?? null,
          vatChecksumValid: result.vat?.checksumValid ?? null,
          viesStatus: result.vat?.vies.status ?? null,
          taxValidationStatus: result.taxValidationStatus,
        },
      },
    })
  },

  async persistUserVerification(userId: string, result: TaxValidationResult): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(result.fiscalCode?.normalized
          ? { fiscalCode: result.fiscalCode.normalized, fiscalCodeValid: result.fiscalCode.valid }
          : {}),
        ...(result.vat?.normalized
          ? {
              vatNumber: `${result.vat.countryCode}${result.vat.normalized}`,
              vatCountryCode: result.vat.countryCode,
              vatFormatValid: result.vat.formatValid,
              vatChecksumValid: result.vat.checksumValid,
              viesValid: result.vat.vies.valid,
              viesName: result.vat.vies.name,
              viesAddress: result.vat.vies.address,
              ...(result.vat.autofill.companyName
                ? { companyName: result.vat.autofill.companyName }
                : pickViesCompanyName(result.vat.vies.name)
                  ? { companyName: pickViesCompanyName(result.vat.vies.name)! }
                  : {}),
            }
          : {}),
        taxValidationStatus: result.taxValidationStatus,
        taxCheckedAt: new Date(),
      },
    })
  },
}
