import type { Request } from 'express'
import { prisma } from '../../lib/prisma.js'
import { writeIntegrationLog } from '../../lib/integration-log.js'
import { AppError } from '../../types/errors.js'
import { normalizeCountryCode } from './tax.constants.js'
import { taxValidationService } from './tax-validation.service.js'
import { validateItalianVatNumber } from './italian-vat.validation.js'
import { checkVies } from './vies.client.js'
import { vatCacheRepository } from './vat-cache.repository.js'

const MAX_ATTEMPTS_BEFORE_FORCE = 3

export type VatValidationResult = {
  valid: boolean
  vatForceAccepted: boolean
  attempts: number
  companyName?: string | null
  vatNumber: string
  countryCode: string
}

function parseVatNumber(raw: string, countryHint?: string): { countryCode: string; vatNumber: string } {
  const cleaned = raw.replace(/[\s.-]/g, '').toUpperCase()
  const prefix = cleaned.slice(0, 2)
  if (/^[A-Z]{2}$/.test(prefix) && cleaned.length > 2) {
    return { countryCode: prefix, vatNumber: cleaned.slice(2) }
  }
  const countryCode = normalizeCountryCode(countryHint ?? 'IT')
  return { countryCode, vatNumber: cleaned }
}

async function resolveViesValid(
  countryCode: string,
  vatNumber: string,
  correlationId?: string,
): Promise<{ valid: boolean; name?: string | null; serviceUnavailable: boolean }> {
  const cached = await vatCacheRepository.get(countryCode, vatNumber)
  if (cached) {
    return { valid: cached.valid, name: cached.name, serviceUnavailable: false }
  }

  const vies = await checkVies(countryCode, vatNumber, correlationId)
  if (vies.status === 'service_unavailable') {
    return { valid: false, name: null, serviceUnavailable: true }
  }

  await vatCacheRepository.set(countryCode, vatNumber, vies)
  return {
    valid: vies.valid === true,
    name: vies.name ?? null,
    serviceUnavailable: false,
  }
}

function assertSession(req: Request) {
  const s = req.sessionRecord
  if (!s) {
    throw new AppError('NO_SESSION', 'Session missing', 'Sessione non disponibile.', 500, false)
  }
  return s
}

export const vatValidationService = {
  /** Controllo VIES senza sessione (es. form professionisti). */
  async checkOnce(rawVatNumber: string, countryHint?: string): Promise<VatValidationResult> {
    const { countryCode, vatNumber } = parseVatNumber(rawVatNumber, countryHint)
    const normalizedKey = `${countryCode}${vatNumber}`

    if (countryCode === 'IT') {
      const local = validateItalianVatNumber(vatNumber)
      if (!local.valid) {
        return {
          valid: false,
          vatForceAccepted: false,
          attempts: 1,
          companyName: null,
          vatNumber: normalizedKey,
          countryCode,
        }
      }
    }

    const vies = await resolveViesValid(countryCode, vatNumber)
    if (vies.serviceUnavailable) {
      return {
        valid: false,
        vatForceAccepted: false,
        attempts: 1,
        companyName: null,
        vatNumber: normalizedKey,
        countryCode,
      }
    }

    return {
      valid: vies.valid,
      vatForceAccepted: false,
      attempts: 1,
      companyName: vies.name ?? null,
      vatNumber: normalizedKey,
      countryCode,
    }
  },

  async validate(req: Request, rawVatNumber: string, countryHint?: string): Promise<VatValidationResult> {
    const session = assertSession(req)
    const { countryCode, vatNumber } = parseVatNumber(rawVatNumber, countryHint)
    const normalizedKey = `${countryCode}${vatNumber}`

    if (countryCode === 'IT') {
      const local = validateItalianVatNumber(vatNumber)
      if (!local.valid) {
        throw new AppError(
          'VAT_INVALID',
          'Invalid VAT number',
          local.errors[0] ?? 'Partita IVA non valida.',
          400,
          false,
        )
      }
    }

    let row = await prisma.vatValidationAttempt.findUnique({
      where: { sessionId_vatNumber: { sessionId: session.id, vatNumber: normalizedKey } },
    })

    if (!row) {
      row = await prisma.vatValidationAttempt.create({
        data: { sessionId: session.id, vatNumber: normalizedKey, attemptCount: 0 },
      })
    }

    if (row.forceAccepted) {
      return {
        valid: false,
        vatForceAccepted: true,
        attempts: row.attemptCount,
        companyName: null,
        vatNumber: normalizedKey,
        countryCode,
      }
    }

    const vies = await resolveViesValid(countryCode, vatNumber, req.correlationId)
    const nextAttempts = row.attemptCount + 1

    if (vies.serviceUnavailable) {
      return {
        valid: false,
        vatForceAccepted: false,
        attempts: nextAttempts,
        companyName: null,
        vatNumber: normalizedKey,
        countryCode,
      }
    }

    const forceAccepted = !vies.valid && nextAttempts >= MAX_ATTEMPTS_BEFORE_FORCE

    row = await prisma.vatValidationAttempt.update({
      where: { id: row.id },
      data: {
        attemptCount: nextAttempts,
        lastValid: vies.valid,
        forceAccepted,
      },
    })

    if (!vies.valid && !forceAccepted) {
      throw new AppError(
        'VAT_INVALID',
        'Invalid VAT number',
        'Partita IVA non valida. Verifica il numero e riprova.',
        400,
        false,
        { attempts: nextAttempts, maxAttempts: MAX_ATTEMPTS_BEFORE_FORCE },
      )
    }

    if (forceAccepted && !vies.valid) {
      await writeIntegrationLog({
        service: 'vat',
        operation: 'force_accepted',
        correlationId: req.correlationId,
        success: false,
        requestRedacted: { vatNumber: normalizedKey, attempts: nextAttempts },
        responseRedacted: { viesValid: false, forceAccepted: true },
        startedAt: new Date(),
        finishedAt: new Date(),
      })
    }

    return {
      valid: vies.valid,
      vatForceAccepted: forceAccepted && !vies.valid,
      attempts: row.attemptCount,
      companyName: vies.name ?? null,
      vatNumber: normalizedKey,
      countryCode,
    }
  },

  /** Usato da professional-account con tax validation unificata. */
  async validateViaTaxService(
    rawVatNumber: string,
    countryHint: string,
    personType: 'private' | 'company' = 'company',
  ) {
    return taxValidationService.validate({
      countryCode: countryHint,
      vatNumber: rawVatNumber,
      personType,
    })
  },
}
