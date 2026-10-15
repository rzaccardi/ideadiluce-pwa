import { Prisma } from '@prisma/client'
import type { CustomerSegment } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { isOdooConfigured, odooAuthenticatePortalUser } from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'
import type { OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { updateOdooPortalUserLogin } from '../../adapters/odoo/odooPortalUserAdapter.js'
import type { CheckoutBusinessFields } from '../checkout/checkout.validators.js'
import { paymentMethodToPrisma } from '../payments/payment.types.js'
import { taxValidationService } from '../tax/tax-validation.service.js'
import { AppError } from '../../types/errors.js'
import { invalidateSessionCacheForSession } from '../../middlewares/session.js'
import { toUserDTO } from './user.mapper.js'
import type { changePasswordSchema, patchMeSchema } from './users.validators.js'
import type { z } from 'zod'
import { professionalAccountRepository } from '../professional-account/professional-account.repository.js'
import { normalizeProfessionalRequestStatus } from '../professional-account/professional-account.constants.js'
import { runOdooUserProfileSync } from './users-odoo-sync.helper.js'
import { parseOdooShippingAddressId } from '../../adapters/odoo/odoo-partner-shipping.js'
import {
  isOdooAuthIdentityRequired,
  syncPasswordToOdooPortal,
} from '../auth/odoo-account-sync.service.js'

type PatchMeInput = z.infer<typeof patchMeSchema>
type ChangePasswordInput = z.infer<typeof changePasswordSchema>

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
  let b2bActive: boolean | undefined
  try {
    const account = await customerAdapter.getCustomerAccountByPartnerId(ctx, partnerId)
    if (account?.b2bActive != null) b2bActive = Boolean(account.b2bActive)
  } catch {
    /* best-effort */
  }
  if (isPro || b2bActive != null) {
    await prisma.customerSatellite.update({
      where: { id: userId },
      data: {
        ...(isPro ? { isProfessional: true } : {}),
        ...(b2bActive != null ? { b2bActive } : {}),
      },
    })
  }
}

async function syncUserProfileToOdoo(
  ctx: OdooCallContext,
  partnerId: number,
  input: PatchMeInput,
  emailChange?: { oldEmail: string; newEmail: string },
) {
  const shipping = input.shippingAddress
  const shippingPartnerId =
    shipping && shipping !== null ? parseOdooShippingAddressId(shipping.id) : null
  const writeShippingOnParent = shipping === undefined || shipping === null || !shippingPartnerId || shippingPartnerId === partnerId

  await customerAdapter.updateCustomerProfile(ctx, partnerId, {
    ...(emailChange ? { email: emailChange.newEmail } : {}),
    ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
    ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(writeShippingOnParent && shipping !== undefined
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
                  province: shipping.province,
                  country: shipping.country,
                  phone: shipping.phone,
                },
        }
      : {}),
  })

  if (emailChange) {
    await updateOdooPortalUserLogin(ctx, {
      partnerId,
      oldEmail: emailChange.oldEmail,
      newEmail: emailChange.newEmail,
    })
  }

  if (shipping && shippingPartnerId && shippingPartnerId !== partnerId) {
    await customerAdapter.updateDeliveryPartner(ctx, shippingPartnerId, {
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      line1: shipping.line1,
      streetNumber: shipping.streetNumber ?? '',
      isSnc: shipping.isSnc ?? false,
      line2: shipping.line2,
      city: shipping.city,
      postalCode: shipping.postalCode,
      province: shipping.province,
      country: shipping.country,
      phone: shipping.phone,
    })
  }
}

export const usersService = {
  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    ctx?: OdooCallContext,
  ): Promise<void> {
    const user = await prisma.customerSatellite.findUnique({ where: { id: userId } })
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false)
    }

    if (input.currentPassword === input.newPassword) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Password unchanged',
        'La nuova password deve essere diversa da quella attuale.',
        400,
        false,
      )
    }

    const callCtx: OdooCallContext = ctx ?? { correlationId: `change-password:${userId}` }
    let currentOk = false

    if (isOdooAuthIdentityRequired()) {
      const odooUid = await odooAuthenticatePortalUser(callCtx, user.email, input.currentPassword)
      currentOk = odooUid != null
    } else if (user.passwordHash) {
      currentOk = bcrypt.compareSync(input.currentPassword, user.passwordHash)
    } else {
      throw new AppError(
        'PASSWORD_NOT_SET',
        'Password not set',
        'Questo account non ha una password da modificare.',
        400,
        false,
      )
    }

    if (!currentOk) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        'Current password invalid',
        'La password attuale non è corretta.',
        400,
        false,
      )
    }

    if (isOdooAuthIdentityRequired()) {
      try {
        const synced = await syncPasswordToOdooPortal(callCtx, user.email, input.newPassword)
        if (!synced) {
          throw new AppError(
            'ODOO_PASSWORD_SYNC_FAILED',
            'Odoo portal missing',
            'Non siamo riusciti ad aggiornare la password su Odoo. Riprova tra poco.',
            503,
            true,
          )
        }
      } catch (e) {
        if (e instanceof AppError) throw e
        throw new AppError(
          'ODOO_PASSWORD_SYNC_FAILED',
          'Odoo password sync failed',
          'Non siamo riusciti ad aggiornare la password su Odoo. Riprova tra poco.',
          503,
          true,
        )
      }
    }

    await prisma.customerSatellite.update({
      where: { id: userId },
      data: { passwordHash: bcrypt.hashSync(input.newPassword, 10) },
    })
  },

  async patchMe(userId: string, input: PatchMeInput, ctx?: OdooCallContext): Promise<UserPatchResult> {
    const current = await prisma.customerSatellite.findUnique({ where: { id: userId } })
    if (!current) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false)
    }

    let emailChange: { oldEmail: string; newEmail: string } | undefined
    if (input.email !== undefined) {
      const normalized = input.email.toLowerCase().trim()
      if (normalized !== current.email) {
        const taken = await prisma.customerSatellite.findUnique({ where: { email: normalized } })
        if (taken) {
          throw new AppError(
            'EMAIL_TAKEN',
            'Email already registered',
            'Questa email è già in uso.',
            409,
            false,
          )
        }
        emailChange = { oldEmail: current.email, newEmail: normalized }
      }
    }

    const user = await prisma.customerSatellite.update({
      where: { id: userId },
      data: {
        ...(emailChange ? { email: emailChange.newEmail } : {}),
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

    if (emailChange && ctx?.req?.sessionRecord?.id) {
      invalidateSessionCacheForSession(ctx.req.sessionRecord.id)
    }

    let odooSyncFailed = false

    if (ctx && env.ODOO_ENABLED && isOdooConfigured()) {
      const map = await prisma.odooCustomerMap.findUnique({ where: { odooPartnerId: (await prisma.customerSatellite.findUniqueOrThrow({ where: { id: userId }, select: { odooPartnerId: true } })).odooPartnerId } })
      if (map) {
        odooSyncFailed = await runOdooUserProfileSync(
          ctx,
          { userId, partnerId: map.odooPartnerId, operation: 'patch_me_profile_sync' },
          () => syncUserProfileToOdoo(ctx, map.odooPartnerId, input, emailChange),
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
      const satellite = await prisma.customerSatellite.findUniqueOrThrow({
        where: { id: userId },
        select: { odooPartnerId: true },
      })
      validationResult = await taxValidationService.validate(
        {
          countryCode: input.billingCountry ?? 'IT',
          fiscalCode: input.fiscalCode,
          vatNumber: input.vatNumber,
          personType,
        },
        { odooPartnerId: satellite.odooPartnerId, correlationId: ctx?.correlationId },
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

    const user = await prisma.customerSatellite.findUnique({ where: { id: userId } })
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 'Utente non trovato.', 404, false)
    }

    const updatedUser = await prisma.customerSatellite.update({
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
      const map = await prisma.odooCustomerMap.findUnique({ where: { odooPartnerId: (await prisma.customerSatellite.findUniqueOrThrow({ where: { id: userId }, select: { odooPartnerId: true } })).odooPartnerId } })
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
    const satellite = await prisma.customerSatellite.findUnique({
      where: { id: userId },
      select: { odooPartnerId: true },
    })
    const row = await professionalAccountRepository.findLatestForAccount({
      odooPartnerId: satellite?.odooPartnerId ?? null,
      email,
    })
    if (!row) return null
    return {
      id: row.id,
      status: normalizeProfessionalRequestStatus(row.status),
      companyName: row.companyName,
      createdAt: row.createdAt.toISOString(),
    }
  },
}
