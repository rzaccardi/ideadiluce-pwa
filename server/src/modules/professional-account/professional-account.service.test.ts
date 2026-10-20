import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request } from 'express'
import { AppError } from '../../types/errors.js'

const {
  sendPwaMail,
  odooApiCreateBusinessRequest,
  isOdooApiV2Configured,
  hasOpenRequest,
  createRequest,
  updateRequest,
  validateTax,
  findSatelliteByEmail,
  createUser,
  prismaUserUpdate,
  prismaOdooMapUpsert,
  provisionOdooAuthIdentity,
  persistOdooCustomerMap,
  assertOdooAuthReadyForIdentity,
  isOdooAuthIdentityRequired,
  ensureSatelliteProjection,
  findOdooPortalUserByEmail,
  findOrCreateCustomer,
  updateCustomerBusiness,
} = vi.hoisted(() => ({
  sendPwaMail: vi.fn(),
  odooApiCreateBusinessRequest: vi.fn(),
  isOdooApiV2Configured: vi.fn(() => false),
  hasOpenRequest: vi.fn(),
  createRequest: vi.fn(),
  updateRequest: vi.fn(),
  validateTax: vi.fn(),
  findSatelliteByEmail: vi.fn(),
  createUser: vi.fn(),
  prismaUserUpdate: vi.fn(),
  prismaOdooMapUpsert: vi.fn(),
  provisionOdooAuthIdentity: vi.fn(),
  persistOdooCustomerMap: vi.fn(),
  assertOdooAuthReadyForIdentity: vi.fn(),
  isOdooAuthIdentityRequired: vi.fn(() => false),
  ensureSatelliteProjection: vi.fn(),
  findOdooPortalUserByEmail: vi.fn(),
  findOrCreateCustomer: vi.fn(),
  updateCustomerBusiness: vi.fn(),
}))

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('../../lib/mail.js', () => ({
  publicAppUrl: (path: string) => `https://www.ideadiluce.com${path}`,
}))

vi.mock('../../adapters/odoo/odooMailAdapter.js', () => ({
  sendPwaMail,
  PWA_ADMIN_MAIL_TO: 'info@ideadiluce.com',
}))

vi.mock('../../adapters/odoo-api/odooApiClient.js', () => ({
  isOdooApiV2Configured: () => isOdooApiV2Configured(),
}))

vi.mock('../../adapters/odoo-api/odooApi.resources.js', () => ({
  odooApiCreateBusinessRequest: (...args: unknown[]) => odooApiCreateBusinessRequest(...args),
}))

vi.mock('../../adapters/odoo/odooCustomerAdapter.js', () => ({
  createOdooCustomerAdapter: () => ({
    findOrCreateCustomer,
    updateCustomerBusiness,
  }),
}))

vi.mock('../../adapters/odoo/odooPortalUserAdapter.js', () => ({
  findOdooPortalUserByEmail,
}))

vi.mock('../../adapters/spaces/spaces.storage.js', () => ({
  isSpacesConfigured: () => false,
  spacesPublicUrl: () => '',
  uploadProductImage: vi.fn(),
}))

vi.mock('../../config/env.js', () => ({
  env: { ODOO_ENABLED: false },
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    customerSatellite: { update: prismaUserUpdate },
    odooCustomerMap: { upsert: prismaOdooMapUpsert },
  },
}))

vi.mock('../tax/tax-validation.service.js', () => ({
  taxValidationService: { validate: validateTax },
}))

vi.mock('../auth/auth.repository.js', () => ({
  authRepository: {
    findSatelliteByEmail,
    findUserByEmail: findSatelliteByEmail,
    createUser,
  },
}))

vi.mock('../auth/odoo-account-sync.service.js', () => ({
  provisionOdooAuthIdentity,
  persistOdooCustomerMap,
  assertOdooAuthReadyForIdentity,
  isOdooAuthIdentityRequired,
}))

vi.mock('../auth/satellite-projection.service.js', () => ({
  ensureSatelliteProjection,
}))

vi.mock('./professional-account.repository.js', () => ({
  professionalAccountRepository: {
    hasOpenRequest,
    create: createRequest,
    update: updateRequest,
  },
}))

import { professionalAccountService } from './professional-account.service.js'

const baseInput = {
  companyName: 'Acme Illuminazione Srl',
  vatNumber: 'IT12345678901',
  sector: 'Installatori',
  contactName: 'Mario Rossi',
  email: 'mario@acme.it',
  locale: 'IT',
  country: 'IT',
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    correlationId: 'corr-pro-1',
    sessionRecord: null,
    ...overrides,
  } as unknown as Request
}

describe('professionalAccountService.submit - business-request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isOdooAuthIdentityRequired.mockReturnValue(false)
    isOdooApiV2Configured.mockReturnValue(true)
    odooApiCreateBusinessRequest.mockResolvedValue({ logged: true, activity_id: 1, customer_id: 99 })
    sendPwaMail.mockResolvedValue(undefined)
    hasOpenRequest.mockResolvedValue(false)
    createRequest.mockResolvedValue({
      id: 'req-1',
      companyName: 'Acme Illuminazione Srl',
      vatNumber: 'IT12345678901',
      contactName: 'Mario Rossi',
      email: 'mario@acme.it',
      phone: null,
      pec: null,
      sdiCode: null,
      message: null,
      locale: 'IT',
    })
    updateRequest.mockResolvedValue({})
    validateTax.mockResolvedValue({
      taxValidationStatus: 'ok',
      vat: {
        formatValid: true,
        checksumValid: true,
        countryCode: 'IT',
        normalized: '12345678901',
        errors: [],
        autofill: { companyName: null },
        vies: { checked: false, status: 'unknown', name: null, address: null, requestDate: null },
      },
    })
    findSatelliteByEmail.mockResolvedValue(null)
    createUser.mockResolvedValue({ id: 'user-new' })
    prismaUserUpdate.mockResolvedValue({})
  })

  it('notifica Odoo via business-request quando c’è partner', async () => {
    findSatelliteByEmail.mockResolvedValue({
      id: 'user-existing',
      passwordHash: 'hash',
      odooPartnerId: 99,
    })
    prismaUserUpdate.mockResolvedValue({
      id: 'user-existing',
      odooPartnerId: 99,
    })

    await professionalAccountService.submit(mockReq(), baseInput)

    expect(assertOdooAuthReadyForIdentity).toHaveBeenCalled()
    expect(odooApiCreateBusinessRequest).toHaveBeenCalledWith(
      99,
      expect.objectContaining({
        company_name: 'Acme Illuminazione Srl',
        vat: 'IT12345678901',
        contact_name: 'Mario Rossi',
        email: 'mario@acme.it',
        sector: 'Installatori',
      }),
      'corr-pro-1',
    )
    expect(sendPwaMail).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ templateKey: 'account_credentials' }),
    )
  })

  it('con account nuovo invia anche le credenziali', async () => {
    await professionalAccountService.submit(mockReq(), baseInput)

    expect(sendPwaMail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        templateKey: 'account_credentials',
        emailTo: 'mario@acme.it',
        vars: expect.objectContaining({
          email: 'mario@acme.it',
          password: expect.any(String),
          login_url: 'https://www.ideadiluce.com/login',
        }),
      }),
    )
  })

  it('non fallisce la submit se business-request fallisce', async () => {
    findSatelliteByEmail.mockResolvedValue({
      id: 'user-existing',
      passwordHash: 'hash',
      odooPartnerId: 99,
    })
    odooApiCreateBusinessRequest.mockRejectedValue(new Error('odoo down'))

    const result = await professionalAccountService.submit(mockReq(), baseInput)
    expect(result).toMatchObject({ submitted: true, id: 'req-1' })
  })
})

describe('professionalAccountService.submit - Odoo-first', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isOdooAuthIdentityRequired.mockReturnValue(true)
    isOdooApiV2Configured.mockReturnValue(true)
    odooApiCreateBusinessRequest.mockResolvedValue({ logged: true, activity_id: 1, customer_id: 42 })
    sendPwaMail.mockResolvedValue(undefined)
    hasOpenRequest.mockResolvedValue(false)
    createRequest.mockResolvedValue({
      id: 'req-1',
      companyName: 'Acme Illuminazione Srl',
      vatNumber: 'IT12345678901',
      contactName: 'Mario Rossi',
      email: 'mario@acme.it',
      phone: null,
      pec: null,
      sdiCode: null,
      message: null,
      locale: 'IT',
    })
    updateRequest.mockResolvedValue({})
    validateTax.mockResolvedValue({
      taxValidationStatus: 'ok',
      vat: {
        formatValid: true,
        checksumValid: true,
        countryCode: 'IT',
        normalized: '12345678901',
        errors: [],
        autofill: { companyName: null },
        vies: { checked: false, status: 'unknown', name: null, address: null, requestDate: null },
      },
    })
    findSatelliteByEmail.mockResolvedValue(null)
    findOdooPortalUserByEmail.mockResolvedValue(null)
    createUser.mockResolvedValue({ id: 'user-new' })
    ensureSatelliteProjection.mockResolvedValue({
      id: 'user-new',
      email: 'mario@acme.it',
      odooPartnerId: 42,
    })
    prismaUserUpdate.mockResolvedValue({})
    persistOdooCustomerMap.mockResolvedValue(undefined)
    updateCustomerBusiness.mockResolvedValue(undefined)
    provisionOdooAuthIdentity.mockResolvedValue({
      odooPartnerId: 42,
      odooUserId: 7,
      portalCreated: true,
    })
  })

  it('provisiona Odoo poi proiezione satellite (niente createUser diretto)', async () => {
    await professionalAccountService.submit(mockReq(), baseInput)

    expect(assertOdooAuthReadyForIdentity).toHaveBeenCalled()
    expect(findOdooPortalUserByEmail).toHaveBeenCalled()
    expect(provisionOdooAuthIdentity).toHaveBeenCalledWith(
      { correlationId: 'corr-pro-1' },
      expect.objectContaining({
        email: 'mario@acme.it',
        password: expect.any(String),
        firstName: 'Mario',
        lastName: 'Rossi',
        rejectExistingPortal: true,
        business: expect.objectContaining({
          companyName: 'Acme Illuminazione Srl',
          vatNumber: 'IT12345678901',
          isCompany: true,
        }),
      }),
    )
    expect(ensureSatelliteProjection).toHaveBeenCalledWith(
      expect.objectContaining({
        odooPartnerId: 42,
        email: 'mario@acme.it',
        clearLocalPassword: true,
      }),
    )
    expect(createUser).not.toHaveBeenCalled()
    expect(createRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        odooPartnerId: 42,
      }),
    )
    expect(odooApiCreateBusinessRequest).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        company_name: 'Acme Illuminazione Srl',
        vat: 'IT12345678901',
      }),
      'corr-pro-1',
    )
    expect(sendPwaMail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ templateKey: 'account_credentials' }),
    )
  })

  it('non crea satellite né richiesta se Odoo fallisce', async () => {
    provisionOdooAuthIdentity.mockRejectedValue(
      new AppError('ODOO_REGISTER_FAILED', 'fail', 'errore', 503, true),
    )

    await expect(professionalAccountService.submit(mockReq(), baseInput)).rejects.toMatchObject({
      code: 'ODOO_REGISTER_FAILED',
    })

    expect(ensureSatelliteProjection).not.toHaveBeenCalled()
    expect(createUser).not.toHaveBeenCalled()
    expect(createRequest).not.toHaveBeenCalled()
    expect(sendPwaMail).not.toHaveBeenCalled()
  })

  it('se portal già esiste aggiorna business + satellite senza nuove credenziali', async () => {
    findOdooPortalUserByEmail.mockResolvedValue({
      odooUserId: 2,
      odooPartnerId: 11,
    })
    ensureSatelliteProjection.mockResolvedValue({
      id: 'u-existing',
      email: 'mario@acme.it',
      odooPartnerId: 11,
    })

    await professionalAccountService.submit(mockReq(), baseInput)

    expect(provisionOdooAuthIdentity).not.toHaveBeenCalled()
    expect(updateCustomerBusiness).toHaveBeenCalledWith(
      expect.anything(),
      11,
      expect.objectContaining({ companyName: 'Acme Illuminazione Srl' }),
    )
    expect(ensureSatelliteProjection).toHaveBeenCalledWith(
      expect.objectContaining({ odooPartnerId: 11, clearLocalPassword: true }),
    )
    expect(sendPwaMail).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ templateKey: 'account_credentials' }),
    )
  })

  it('con utente già autenticato non crea portal ma sync business soft', async () => {
    findOrCreateCustomer.mockResolvedValue({ odooPartnerId: 55 })
    const req = mockReq({
      sessionRecord: { id: 'sess-1', odooPartnerId: 55, user: { id: 'user-session', odooPartnerId: 55 } } as unknown as Request['sessionRecord'],
    })

    await professionalAccountService.submit(req, baseInput)

    expect(provisionOdooAuthIdentity).not.toHaveBeenCalled()
    expect(createUser).not.toHaveBeenCalled()
    expect(findOrCreateCustomer).toHaveBeenCalled()
    expect(updateCustomerBusiness).toHaveBeenCalledWith(
      expect.anything(),
      55,
      expect.objectContaining({ companyName: 'Acme Illuminazione Srl', isCompany: true }),
    )
    expect(persistOdooCustomerMap).toHaveBeenCalledWith({
      email: 'mario@acme.it',
      odooPartnerId: 55,
    })
    expect(sendPwaMail).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ templateKey: 'account_credentials' }),
    )
  })
})
