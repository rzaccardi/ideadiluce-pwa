import type { Request } from 'express'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { logger } from '../../lib/logger.js'
import { sendPwaMail, PWA_ADMIN_MAIL_TO } from '../../adapters/odoo/odooMailAdapter.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import { isSpacesConfigured, spacesPublicUrl, uploadProductImage } from '../../adapters/spaces/spaces.storage.js'
import { createOdooCustomerAdapter, type OdooBusinessProfile } from '../../adapters/odoo/odooCustomerAdapter.js'
import { type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import { generateAccountPassword } from '../../lib/generate-password.js'
import { publicAppUrl } from '../../lib/mail.js'
import { AppError } from '../../types/errors.js'
import { taxValidationService } from '../tax/tax-validation.service.js'
import { authRepository } from '../auth/auth.repository.js'
import {
  assertOdooAuthReadyForIdentity,
  isOdooAuthIdentityRequired,
  persistOdooCustomerMap,
  provisionOdooAuthIdentity,
} from '../auth/odoo-account-sync.service.js'
import { ensureSatelliteProjection } from '../auth/satellite-projection.service.js'
import { findOdooPortalUserByEmail } from '../../adapters/odoo/odooPortalUserAdapter.js'
import { professionalAccountRepository } from './professional-account.repository.js'
import type { ProfessionalAccountRequestInput } from './professional-account.validators.js'
import { normalizeCountryCode } from '../tax/tax.constants.js'

const customerAdapter = createOdooCustomerAdapter()

function splitContactName(contactName: string): { firstName: string; lastName: string } {
  const parts = contactName.trim().split(/\s+/)
  if (parts.length <= 1) return { firstName: parts[0] ?? '', lastName: '' }
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') }
}

async function storeVisura(
  requestId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string },
): Promise<string | null> {
  if (isSpacesConfigured()) {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf'
    const key = `professional-requests/${requestId}/${randomUUID()}${ext}`
    const { PutObjectCommand, S3Client } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      endpoint: env.SPACES_ENDPOINT!.trim(),
      region: env.SPACES_REGION?.trim() || 'us-east-1',
      credentials: {
        accessKeyId: env.SPACES_KEY!.trim(),
        secretAccessKey: env.SPACES_SECRET!.trim(),
      },
      forcePathStyle: false,
    })
    await client.send(
      new PutObjectCommand({
        Bucket: env.SPACES_BUCKET!.trim(),
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/pdf',
        ACL: 'public-read',
      }),
    )
    return spacesPublicUrl(key)
  }

  try {
    const uploaded = await uploadProductImage(`professional-${requestId}`, file)
    return uploaded.url
  } catch {
    return null
  }
}

/** Sync profilo business su partner esistente (senza creare/resettare portal). Soft-fail. */
async function syncBusinessPartnerToOdoo(
  ctx: OdooCallContext,
  params: {
    email: string
    firstName: string
    lastName: string
    phone?: string | null
    business: OdooBusinessProfile
    userId: string
  },
): Promise<{ odooPartnerId: number | null; syncError: string | null }> {
  if (!isOdooAuthIdentityRequired()) {
    return { odooPartnerId: null, syncError: null }
  }

  try {
    const partner = await customerAdapter.findOrCreateCustomer(ctx, {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone ?? undefined,
      business: params.business,
    })
    await customerAdapter.updateCustomerBusiness(ctx, partner.odooPartnerId, params.business)
    await prisma.customerSatellite.update({
      where: { id: params.userId },
      data: { odooPartnerId: partner.odooPartnerId },
    })
    await persistOdooCustomerMap({
      email: params.email,
      odooPartnerId: partner.odooPartnerId,
    })
    return { odooPartnerId: partner.odooPartnerId, syncError: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    logger.warn('professional-account.odoo_business_sync_failed', { error: message })
    return { odooPartnerId: null, syncError: message }
  }
}

async function ensureProfessionalUser(params: {
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  companyName: string
  vatNumber: string
  pec?: string | null
  sdiCode?: string | null
  fiscalCode?: string | null
  viesName?: string | null
  viesAddress?: string | null
  viesRequestDate?: string | null
  sessionUserId?: string | null
  correlationId: string
}): Promise<{
  userId: string
  accountCreated: boolean
  plainPassword?: string
  odooPartnerId: number | null
  odooSyncError: string | null
}> {
  const ctx: OdooCallContext = { correlationId: params.correlationId }
  const business: OdooBusinessProfile = {
    companyName: params.companyName,
    vatNumber: params.vatNumber,
    pec: params.pec,
    sdiCode: params.sdiCode,
    fiscalCode: params.fiscalCode,
    viesName: params.viesName,
    viesAddress: params.viesAddress,
    viesRequestDate: params.viesRequestDate,
    isCompany: true,
  }

  const businessLocal = {
    customerSegment: 'BUSINESS' as const,
    companyName: params.companyName,
    vatNumber: params.vatNumber,
    pec: params.pec ?? undefined,
    sdiCode: params.sdiCode ?? undefined,
    fiscalCode: params.fiscalCode ?? undefined,
  }

  if (params.sessionUserId) {
    await prisma.customerSatellite.update({
      where: { id: params.sessionUserId },
      data: {
        ...businessLocal,
        firstName: params.firstName || undefined,
        lastName: params.lastName || undefined,
        phone: params.phone ?? undefined,
      },
    })
    const sync = await syncBusinessPartnerToOdoo(ctx, {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      business,
      userId: params.sessionUserId,
    })
    return {
      userId: params.sessionUserId,
      accountCreated: false,
      odooPartnerId: sync.odooPartnerId,
      odooSyncError: sync.syncError,
    }
  }

  const email = params.email.toLowerCase().trim()
  assertOdooAuthReadyForIdentity()

  // Identity = Odoo only: se portal esiste aggiorna business + satellite, non “trovare” User locale.
  if (isOdooAuthIdentityRequired()) {
    const existingPortal = await findOdooPortalUserByEmail(ctx, email)
    if (existingPortal) {
      try {
        await customerAdapter.updateCustomerBusiness(ctx, existingPortal.odooPartnerId, business)
      } catch (e) {
        logger.warn('professional-account.odoo_business_update_failed', {
          odooPartnerId: existingPortal.odooPartnerId,
          error: e instanceof Error ? e.message : String(e),
        })
      }
      const satellite = await ensureSatelliteProjection({
        odooPartnerId: existingPortal.odooPartnerId,
        email,
        firstName: params.firstName,
        lastName: params.lastName,
        phone: params.phone,
        ...businessLocal,
        clearLocalPassword: true,
      })
      return {
        userId: satellite.id,
        accountCreated: false,
        odooPartnerId: existingPortal.odooPartnerId,
        odooSyncError: null,
      }
    }

    const plainPassword = generateAccountPassword()
    const odoo = await provisionOdooAuthIdentity(ctx, {
      email,
      password: plainPassword,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      business,
      rejectExistingPortal: true,
    })
    try {
      await customerAdapter.updateCustomerBusiness(ctx, odoo.odooPartnerId, business)
    } catch (e) {
      logger.warn('professional-account.odoo_business_update_failed', {
        odooPartnerId: odoo.odooPartnerId,
        error: e instanceof Error ? e.message : String(e),
      })
    }
    const satellite = await ensureSatelliteProjection({
      odooPartnerId: odoo.odooPartnerId,
      email,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      ...businessLocal,
      clearLocalPassword: true,
    })
    return {
      userId: satellite.id,
      accountCreated: true,
      plainPassword,
      odooPartnerId: odoo.odooPartnerId,
      odooSyncError: null,
    }
  }

  // Path locale (ODOO_ENABLED=false): satellite + password solo per dev.
  const existing = await authRepository.findSatelliteByEmail(email)
  if (existing) {
    await prisma.customerSatellite.update({
      where: { id: existing.id },
      data: {
        ...businessLocal,
        firstName: params.firstName || existing.firstName,
        lastName: params.lastName || existing.lastName,
        phone: params.phone?.trim() || existing.phone,
      },
    })
    return {
      userId: existing.id,
      accountCreated: false,
      odooPartnerId: existing.odooPartnerId,
      odooSyncError: null,
    }
  }

  const plainPassword = generateAccountPassword()
  const passwordHash = bcrypt.hashSync(plainPassword, 10)
  const user = await authRepository.createUser({
    email,
    passwordHash,
    firstName: params.firstName,
    lastName: params.lastName,
    phone: params.phone?.trim(),
    customerSegment: 'BUSINESS',
    companyName: params.companyName,
    vatNumber: params.vatNumber,
  })
  await prisma.customerSatellite.update({
    where: { id: user.id },
    data: {
      pec: params.pec ?? undefined,
      sdiCode: params.sdiCode ?? undefined,
      fiscalCode: params.fiscalCode ?? undefined,
    },
  })
  return {
    userId: user.id,
    accountCreated: true,
    plainPassword,
    odooPartnerId: null,
    odooSyncError: null,
  }
}

export const professionalAccountService = {
  async submit(
    req: Request,
    input: ProfessionalAccountRequestInput,
    visuraFile?: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    const locale = parseHubLocale(input.locale ?? 'IT')
    const email = input.email.trim().toLowerCase()
    const country = normalizeCountryCode(input.country ?? 'IT')
    const sectorLabel =
      input.sector === 'Altro' ? `Altro: ${input.sectorOther?.trim()}` : input.sector.trim()
    const { firstName, lastName } = splitContactName(input.contactName)

    const taxCheck = await taxValidationService.validate(
      {
        countryCode: country,
        vatNumber: input.vatNumber,
        personType: 'company',
      },
      {
        odooPartnerId:
          req.sessionRecord?.odooPartnerId ?? req.sessionRecord?.user?.odooPartnerId ?? null,
        sessionId: req.sessionRecord?.id,
        correlationId: req.correlationId,
      },
    )

    if (
      taxCheck.vat &&
      (!taxCheck.vat.formatValid || !taxCheck.vat.checksumValid)
    ) {
      throw new AppError(
        'VAT_INVALID',
        'Invalid VAT number',
        taxCheck.vat.errors[0] ?? 'Partita IVA non valida.',
        400,
        false,
      )
    }

    const viesUnavailable = taxCheck.taxValidationStatus === 'vies_unavailable'
    const viesInvalid =
      taxCheck.vat?.vies.checked === true && taxCheck.vat.vies.status === 'invalid'

    if (viesInvalid && country !== 'IT') {
      throw new AppError(
        'VAT_INVALID',
        'Invalid VAT number',
        'Partita IVA non valida su VIES. Verifica il numero e riprova.',
        400,
        false,
      )
    }

    const openRequest = await professionalAccountRepository.hasOpenRequest({
      odooPartnerId: req.sessionRecord?.odooPartnerId ?? null,
      email,
    })
    if (openRequest) {
      throw new AppError(
        'PROFESSIONAL_REQUEST_PENDING',
        'Open professional request exists',
        'Hai già una richiesta in valutazione. Ti contatteremo a breve.',
        409,
        false,
      )
    }

    // Fail-closed: con ODOO_ENABLED senza XML-RPC non creare account solo-PWA.
    assertOdooAuthReadyForIdentity()

    const vatValidated = taxCheck.vat?.vies.status === 'valid'
    const normalizedVat = taxCheck.vat
      ? `${taxCheck.vat.countryCode}${taxCheck.vat.normalized}`
      : input.vatNumber.replace(/[\s.-]/g, '').toUpperCase()

    const companyName =
      input.companyName.trim() ||
      taxCheck.vat?.autofill.companyName ||
      taxCheck.vat?.vies.name ||
      input.companyName.trim()

    const structuredNotes = [
      input.message?.trim() || null,
      input.fiscalCode?.trim() ? `Codice fiscale: ${input.fiscalCode.trim().toUpperCase()}` : null,
      input.addressLine?.trim() ? `Indirizzo: ${input.addressLine.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    // Identità (Odoo-first se richiesta) prima della riga richiesta, per non lasciare pending orfani.
    const userResult = await ensureProfessionalUser({
      email,
      firstName,
      lastName,
      phone: input.phone,
      companyName,
      vatNumber: normalizedVat,
      pec: input.pec?.trim() || null,
      sdiCode: input.sdiCode?.trim().toUpperCase() || null,
      fiscalCode: input.fiscalCode?.trim().toUpperCase() || null,
      viesName: taxCheck.vat?.vies.name ?? null,
      viesAddress: taxCheck.vat?.vies.address ?? null,
      viesRequestDate: taxCheck.vat?.vies.requestDate ?? null,
      sessionUserId: req.sessionRecord?.user?.id ?? null,
      correlationId: req.correlationId,
    })

    const row = await professionalAccountRepository.create({
      companyName,
      vatNumber: normalizedVat,
      sector: input.sector.trim(),
      sectorOther: input.sectorOther?.trim() || null,
      contactName: input.contactName.trim(),
      email,
      phone: input.phone?.trim() || null,
      pec: input.pec?.trim() || null,
      sdiCode: input.sdiCode?.trim().toUpperCase() || null,
      visuraUrl: null,
      message: structuredNotes || null,
      locale,
      country,
      vatValidated,
      vatForceAccepted: viesUnavailable,
      odooPartnerId: userResult.odooPartnerId,
      odooSyncError: userResult.odooSyncError,
    })

    let visuraUrl: string | null = null
    if (visuraFile) {
      visuraUrl = await storeVisura(row.id, visuraFile)
      if (visuraUrl) {
        await professionalAccountRepository.update(row.id, { visuraUrl })
      }
    }

    const viesLabel = vatValidated
      ? 'VIES: valida'
      : viesUnavailable
        ? 'VIES: non disponibile - da verificare'
        : 'VIES: non verificata'

    const lines = [
      'Tipo: Attivazione account business / professionisti',
      `Ragione sociale: ${row.companyName}`,
      `P.IVA: ${row.vatNumber} (${viesLabel})`,
      `Paese: ${country}`,
      taxCheck.vat?.vies.name ? `Denominazione VIES: ${taxCheck.vat.vies.name}` : null,
      `Settore: ${sectorLabel}`,
      `Referente: ${row.contactName}`,
      `Email: ${row.email}`,
      row.phone ? `Telefono: ${row.phone}` : null,
      row.pec ? `PEC: ${row.pec}` : null,
      row.sdiCode ? `Codice SDI: ${row.sdiCode}` : null,
      visuraUrl ? `Visura: ${visuraUrl}` : visuraFile ? 'Visura: allegata a questa email' : null,
      userResult.odooPartnerId ? `Partner Odoo: #${userResult.odooPartnerId}` : null,
      userResult.odooSyncError ? `Sync Odoo: fallita - ${userResult.odooSyncError}` : null,
      userResult.accountCreated
        ? `Account PWA creato (userId: ${userResult.userId})`
        : `Utente collegato: ${userResult.userId}`,
      `Lingua: ${row.locale}`,
      `ID richiesta: ${row.id}`,
      '',
      row.message || '(nessuna nota aggiuntiva)',
    ].filter(Boolean)

    logger.info('professional-account.request', {
      id: row.id,
      email: row.email,
      vatValidated,
      odooPartnerId: userResult.odooPartnerId,
      userId: userResult.userId,
    })

    const ctx: OdooCallContext = { correlationId: req.correlationId, req }
    const firstNameSuffix = firstName ? ` ${firstName}` : ''

    try {
      await sendPwaMail(ctx, {
        templateKey: 'professional_request_admin',
        emailTo: PWA_ADMIN_MAIL_TO,
        vars: {
          company_name: row.companyName,
          body_text: lines.join('\n'),
        },
        attachments:
          visuraFile && !visuraUrl
            ? [{ filename: visuraFile.originalname, content: visuraFile.buffer, mimetype: visuraFile.mimetype }]
            : undefined,
      })
    } catch (err) {
      logger.warn('professional-account.admin_mail_failed', {
        id: row.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    try {
      await sendPwaMail(ctx, {
        templateKey: 'professional_request_customer',
        emailTo: email,
        vars: {
          first_name_suffix: firstNameSuffix,
        },
      })
    } catch (err) {
      logger.warn('professional-account.customer_mail_failed', {
        id: row.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Credenziali solo dopo identità Odoo (se richiesta): provision è già avvenuto sopra.
    if (userResult.accountCreated && userResult.plainPassword) {
      try {
        await sendPwaMail(ctx, {
          templateKey: 'account_credentials',
          emailTo: email,
          vars: {
            first_name_suffix: firstNameSuffix,
            intro:
              'Abbiamo creato un accesso al portale Idea di Luce insieme alla tua richiesta account professionisti.',
            email,
            password: userResult.plainPassword,
            login_url: publicAppUrl('/login'),
          },
        })
      } catch (err) {
        logger.warn('professional-account.credentials_mail_failed', {
          id: row.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return {
      submitted: true,
      id: row.id,
      vatValidated: true,
      accountCreated: userResult.accountCreated,
    }
  },
}
