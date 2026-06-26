import type { Request } from 'express'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { sendMail } from '../../lib/mail.js'
import { logger } from '../../lib/logger.js'
import { parseHubLocale } from '../../lib/hub-locale.js'
import { isSpacesConfigured, spacesPublicUrl, uploadProductImage } from '../../adapters/spaces/spaces.storage.js'
import { createOdooCustomerAdapter } from '../../adapters/odoo/odooCustomerAdapter.js'
import { ensureOdooPortalUser } from '../../adapters/odoo/odooPortalUserAdapter.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import { generateAccountPassword } from '../../lib/generate-password.js'
import { publicAppUrl } from '../../lib/mail.js'
import { AppError } from '../../types/errors.js'
import { taxValidationService } from '../tax/tax-validation.service.js'
import { authRepository } from '../auth/auth.repository.js'
import { professionalAccountRepository } from './professional-account.repository.js'
import type { ProfessionalAccountRequestInput } from './professional-account.validators.js'
import { normalizeCountryCode } from '../tax/tax.constants.js'

const INQUIRY_TO = 'info@ideadiluce.com'
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

async function ensureProfessionalUser(params: {
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  companyName: string
  vatNumber: string
  pec?: string | null
  sdiCode?: string | null
  sessionUserId?: string | null
  correlationId: string
}): Promise<{ userId: string; accountCreated: boolean; plainPassword?: string }> {
  if (params.sessionUserId) {
    await prisma.user.update({
      where: { id: params.sessionUserId },
      data: {
        customerSegment: 'BUSINESS',
        companyName: params.companyName,
        vatNumber: params.vatNumber,
        pec: params.pec ?? undefined,
        sdiCode: params.sdiCode ?? undefined,
        firstName: params.firstName || undefined,
        lastName: params.lastName || undefined,
        phone: params.phone ?? undefined,
      },
    })
    return { userId: params.sessionUserId, accountCreated: false }
  }

  const email = params.email.toLowerCase().trim()
  const existing = await authRepository.findUserByEmail(email)
  if (existing?.passwordHash) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        customerSegment: 'BUSINESS',
        companyName: params.companyName,
        vatNumber: params.vatNumber,
        pec: params.pec ?? undefined,
        sdiCode: params.sdiCode ?? undefined,
      },
    })
    return { userId: existing.id, accountCreated: false }
  }

  const plainPassword = generateAccountPassword()
  const passwordHash = bcrypt.hashSync(plainPassword, 10)

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        firstName: params.firstName || existing.firstName,
        lastName: params.lastName || existing.lastName,
        phone: params.phone?.trim() || existing.phone,
        customerSegment: 'BUSINESS',
        companyName: params.companyName,
        vatNumber: params.vatNumber,
        pec: params.pec ?? undefined,
        sdiCode: params.sdiCode ?? undefined,
      },
    })
    return { userId: existing.id, accountCreated: true, plainPassword }
  }

  const user = await authRepository.createUser({
    email,
    passwordHash,
    firstName: params.firstName,
    lastName: params.lastName,
    phone: params.phone?.trim(),
    customerSegment: 'BUSINESS',
  })
  await prisma.user.update({
    where: { id: user.id },
    data: {
      companyName: params.companyName,
      vatNumber: params.vatNumber,
      pec: params.pec ?? undefined,
      sdiCode: params.sdiCode ?? undefined,
    },
  })
  return { userId: user.id, accountCreated: true, plainPassword }
}

async function syncOdooPartner(
  ctx: OdooCallContext,
  params: {
    email: string
    firstName: string
    lastName: string
    phone?: string | null
    companyName: string
    vatNumber: string
    pec?: string | null
    sdiCode?: string | null
    viesName?: string | null
    viesAddress?: string | null
    viesRequestDate?: string | null
    userId: string
  },
): Promise<{ odooPartnerId: number | null; syncError: string | null }> {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) {
    return { odooPartnerId: null, syncError: null }
  }

  try {
    const business = {
      companyName: params.companyName,
      vatNumber: params.vatNumber,
      pec: params.pec,
      sdiCode: params.sdiCode,
      viesName: params.viesName,
      viesAddress: params.viesAddress,
      viesRequestDate: params.viesRequestDate,
      isCompany: true,
    }

    const partner = await customerAdapter.findOrCreateCustomer(ctx, {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone ?? undefined,
      business,
    })

    await customerAdapter.updateCustomerBusiness(ctx, partner.odooPartnerId, business)

    await prisma.odooCustomerMap.upsert({
      where: { userId: params.userId },
      create: {
        userId: params.userId,
        odooPartnerId: partner.odooPartnerId,
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
      },
      update: {
        odooPartnerId: partner.odooPartnerId,
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
        guestEmail: params.email.toLowerCase(),
      },
    })

    const displayName =
      [params.firstName, params.lastName].filter(Boolean).join(' ').trim() || params.companyName
    try {
      await ensureOdooPortalUser(ctx, {
        email: params.email,
        partnerId: partner.odooPartnerId,
        name: displayName,
        password: generateAccountPassword(),
      })
    } catch {
      /* portal opzionale */
    }

    return { odooPartnerId: partner.odooPartnerId, syncError: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    logger.warn('professional-account.odoo_sync_failed', { error: message })
    return { odooPartnerId: null, syncError: message }
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
        userId: req.sessionRecord?.userId,
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
      userId: req.sessionRecord?.userId ?? null,
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

    const vatValidated = taxCheck.vat?.vies.status === 'valid'
    const normalizedVat = taxCheck.vat
      ? `${taxCheck.vat.countryCode}${taxCheck.vat.normalized}`
      : input.vatNumber.replace(/[\s.-]/g, '').toUpperCase()

    const companyName =
      input.companyName.trim() ||
      taxCheck.vat?.autofill.companyName ||
      taxCheck.vat?.vies.name ||
      input.companyName.trim()

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
      message: input.message?.trim() || null,
      locale,
      country,
      userId: req.sessionRecord?.userId ?? null,
      vatValidated,
      vatForceAccepted: viesUnavailable,
      odooPartnerId: null,
      odooSyncError: null,
    })

    let visuraUrl: string | null = null
    if (visuraFile) {
      visuraUrl = await storeVisura(row.id, visuraFile)
    }

    const userResult = await ensureProfessionalUser({
      email,
      firstName,
      lastName,
      phone: input.phone,
      companyName: row.companyName,
      vatNumber: row.vatNumber,
      pec: row.pec,
      sdiCode: row.sdiCode,
      sessionUserId: req.sessionRecord?.userId ?? null,
      correlationId: req.correlationId,
    })

    const odoo = await syncOdooPartner(
      { correlationId: req.correlationId },
      {
        email,
        firstName,
        lastName,
        phone: row.phone,
        companyName: row.companyName,
        vatNumber: row.vatNumber,
        pec: row.pec,
        sdiCode: row.sdiCode,
        viesName: taxCheck.vat?.vies.name ?? null,
        viesAddress: taxCheck.vat?.vies.address ?? null,
        viesRequestDate: taxCheck.vat?.vies.requestDate ?? null,
        userId: userResult.userId,
      },
    )

    await professionalAccountRepository.update(row.id, {
      userId: userResult.userId,
      visuraUrl,
      odooPartnerId: odoo.odooPartnerId,
      odooSyncError: odoo.syncError,
    })

    const viesLabel = vatValidated
      ? 'VIES: valida'
      : viesUnavailable
        ? 'VIES: non disponibile — da verificare'
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
      odoo.odooPartnerId ? `Partner Odoo: #${odoo.odooPartnerId}` : null,
      odoo.syncError ? `Sync Odoo: fallita — ${odoo.syncError}` : null,
      userResult.accountCreated ? `Account PWA creato (userId: ${userResult.userId})` : `Utente collegato: ${userResult.userId}`,
      `Lingua: ${row.locale}`,
      `ID richiesta: ${row.id}`,
      '',
      row.message || '(nessuna nota aggiuntiva)',
    ].filter(Boolean)

    logger.info('professional-account.request', {
      id: row.id,
      email: row.email,
      vatValidated,
      odooPartnerId: odoo.odooPartnerId,
      userId: userResult.userId,
    })

    await sendMail({
      to: INQUIRY_TO,
      subject: `[Idea di Luce] Attivazione account business — ${row.companyName}`,
      text: lines.join('\n'),
      attachments: visuraFile && !visuraUrl
        ? [{ filename: visuraFile.originalname, content: visuraFile.buffer }]
        : undefined,
    })

    if (userResult.accountCreated && userResult.plainPassword) {
      await sendMail({
        to: email,
        subject: 'Richiesta account professionisti — Idea di Luce',
        text: `Ciao${firstName ? ` ${firstName}` : ''},\n\nAbbiamo ricevuto la tua richiesta di attivazione account business.\nVerificheremo i dati e ti contatteremo entro 24 ore lavorative.\n\nNel frattempo abbiamo creato un accesso al portale:\nEmail: ${email}\nPassword temporanea: ${userResult.plainPassword}\n\nAccedi da: ${publicAppUrl('/login')}`,
      })
    }

    return {
      submitted: true,
      id: row.id,
      vatValidated: true,
      accountCreated: userResult.accountCreated,
    }
  },
}
