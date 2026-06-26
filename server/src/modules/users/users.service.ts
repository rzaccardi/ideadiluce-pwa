import { Prisma } from '@prisma/client'
import type { CustomerSegment } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { isOdooConfigured } from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { CheckoutBusinessFields } from '../checkout/checkout.validators.js'
import { paymentMethodToPrisma } from '../payments/payment.types.js'
import { taxValidationService } from '../tax/tax-validation.service.js'
import { AppError } from '../../types/errors.js'
import { toUserDTO } from './user.mapper.js'
import type { patchMeSchema } from './users.validators.js'
import type { z } from 'zod'
import { professionalAccountRepository } from '../professional-account/professional-account.repository.js'
import { normalizeProfessionalRequestStatus } from '../professional-account/professional-account.constants.js'
import { runOdooUserProfileSync } from './users-odoo-sync.helper.js'

type PatchMeInput = z.infer<typeof patchMeSchema>

export type UserPatchResult = {
  user: Awaited<ReturnType<typeof toUserDTO>>
  odooSyncFailed: boolean
}

const customerAdapter = createOdooCustomerAdapter()

function segmentToPrisma(segment?: 'retail' | 'business'): CustomerSegment | undefined {
  if (segment === 'business') return 'BUSINESS'
  if (segment === 'retail') return 'RETAIL'
  return undefined
}

async function syncUserBusinessToOdoo(
  ctx: OdooCallContext,
  userId: string,
  partnerId: number,
  business: CheckoutBusinessFields & {
    viesName?: string | null
    viesAddress?: string | null
    viesRequestDate?: string | null
  },
) {
  await customerAdapter.updateCustomerBusiness(ctx, partnerId, {
    companyName: business.companyName,
    vatNumber: business.vatNumber,
    fiscalCode: business.fiscalCode,
    pec: business.pec,
    sdiCode: business.sdiCode,
    viesName: business.viesName,
    viesAddress: business.viesAddress,
    viesRequestDate: business.viesRequestDate,
    isCompany: true,
  })
  const isPro = await customerAdapter.syncProfessionalFlagFromPartner(ctx, partnerId)
  if (isPro) {
    await prisma.user.update({ where: { id: userId }, data: { isProfessional: true } })
  }
}

async function syncUserProfileToOdoo(
  ctx: OdooCallContext,
  partnerId: number,
  input: PatchMeInput,
) {
  const shipping = input.shippingAddress
  await customerAdapter.updateCustomerProfile(ctx, partnerId, {
    ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
    ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(shipping !== undefined
      ? {
          shippingAddress:
            shipping === null
              ? null
              : {
                  firstName: shipping.firstName,
                  lastName: shipping.lastName,
                  line1: shipping.line1,
                  streetNumber: shipping.streetNumber,
                  isSnc: shipping.isSnc,
                  line2: shipping.line2,
                  city: shipping.city,
                  postalCode: shipping.postalCode,
                  country: shipping.country,
                  phone: shipping.phone,
                },
        }
      : {}),
  })
}

export const usersService = {
  async patchMe(userId: string, input: PatchMeInput, ctx?: OdooCallContext): Promise<UserPatchResult> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.shippingAddress !== undefined
          ? {
              shippingAddressJson:
                input.shippingAddress === null
                  ? Prisma.DbNull
                  : (input.shippingAddress as Prisma.InputJsonValue),
            }
          : {}),
        ...(input.preferredPaymentMethod !== undefined
          ? {
              preferredPaymentMethod: input.preferredPaymentMethod
                ? paymentMethodToPrisma(input.preferredPaymentMethod)
                : null,
            }
          : {}),
      },
    })

    let odooSyncFailed = false

    if (ctx && env.ODOO_ENABLED && isOdooConfigured()) {
      const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })
      if (map) {
        odooSyncFailed = await runOdooUserProfileSync(
          ctx,
          { userId, partnerId: map.odooPartnerId, operation: 'patch_me_profile_sync' },
          () => syncUserProfileToOdoo(ctx, map.odooPartnerId, input),
        )
      }
    }

    return {
      user: await toUserDTO(user),
      odooSyncFailed,
    }
  },

  async patchBusiness(
    userId: string,
    input: {
      customerSegment?: 'retail' | 'business'
      companyName?: string
      vatNumber?: string
      fiscalCode?: string
      pec?: string
      sdiCode?: string
      billingCountry?: string
    },
    ctx?: OdooCallContext,
  ): Promise<UserPatchResult> {
    const segment = segmentToPrisma(input.customerSegment)
    const personType =
      segment === 'BUSINESS' ||
      input.customerSegment === 'business' ||
      Boolean(input.companyName?.trim()) ||
      Boolean(input.vatNumber?.trim())
        ? 'company'
        : 'private'

    let validationResult = null
    if (input.fiscalCode?.trim() || input.vatNumber?.trim()) {
      validationResult = await taxValidationService.validate(
        {
          countryCode: input.billingCountry ?? 'IT',
          fiscalCode: input.fiscalCode,
          vatNumber: input.vatNumber,
          personType,
        },
        { userId, correlationId: ctx?.correlationId },
      )

      if (validationResult.fiscalCode && !validationResult.fiscalCode.valid) {
        throw new AppError(
          'FISCAL_CODE_INVALID',
          'Invalid fiscal code',
          validationResult.fiscalCode.errors[0] ?? 'Codice fiscale non valido.',
          400,
          false,
        )
      }

      if (
        validationResult.vat &&
        (!validationResult.vat.formatValid || !validationResult.vat.checksumValid)
      ) {
        throw new AppError(
          'VAT_INVALID',
          'Invalid VAT number',
          validationResult.vat.errors[0] ?? 'Partita IVA non valida.',
          400,
          false,
        )
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false)
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(segment ? { customerSegment: segment } : {}),
        ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
        ...(input.vatNumber !== undefined ? { vatNumber: input.vatNumber } : {}),
        ...(input.fiscalCode !== undefined ? { fiscalCode: input.fiscalCode } : {}),
        ...(input.pec !== undefined ? { pec: input.pec } : {}),
        ...(input.sdiCode !== undefined ? { sdiCode: input.sdiCode } : {}),
      },
    })

    let odooSyncFailed = false

    if (ctx && env.ODOO_ENABLED && isOdooConfigured()) {
      const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })
      if (map) {
        odooSyncFailed = await runOdooUserProfileSync(
          ctx,
          { userId, partnerId: map.odooPartnerId, operation: 'patch_me_business_sync' },
          () =>
            syncUserBusinessToOdoo(ctx, userId, map.odooPartnerId, {
              companyName: updatedUser.companyName ?? input.companyName ?? undefined,
              vatNumber: updatedUser.vatNumber ?? input.vatNumber ?? undefined,
              fiscalCode: updatedUser.fiscalCode ?? input.fiscalCode ?? undefined,
              pec: updatedUser.pec ?? input.pec ?? undefined,
              sdiCode: updatedUser.sdiCode ?? input.sdiCode ?? undefined,
              viesName: updatedUser.viesName ?? validationResult?.vat?.vies.name ?? undefined,
              viesAddress: updatedUser.viesAddress ?? validationResult?.vat?.vies.address ?? undefined,
              viesRequestDate: validationResult?.vat?.vies.requestDate ?? undefined,
            }),
        )
      }
    }

    return {
      user: await toUserDTO(updatedUser),
      odooSyncFailed,
    }
  },

  async getMyProfessionalRequest(userId: string, email: string) {
    const row = await professionalAccountRepository.findLatestForAccount({ userId, email })
    if (!row) return null
    return {
      id: row.id,
      status: normalizeProfessionalRequestStatus(row.status),
      companyName: row.companyName,
      createdAt: row.createdAt.toISOString(),
    }
  },
}
