import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request } from 'express'

const {
  sendPwaMail,
  hasOpenRequest,
  createRequest,
  updateRequest,
  validateTax,
  findUserByEmail,
  createUser,
  prismaUserUpdate,
  prismaOdooMapUpsert,
} = vi.hoisted(() => ({
  sendPwaMail: vi.fn(),
  hasOpenRequest: vi.fn(),
  createRequest: vi.fn(),
  updateRequest: vi.fn(),
  validateTax: vi.fn(),
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  prismaUserUpdate: vi.fn(),
  prismaOdooMapUpsert: vi.fn(),
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

vi.mock('../../adapters/odoo/odooClient.js', () => ({
  isOdooLiveConfigured: () => false,
}))

vi.mock('../../adapters/odoo-api/odooApiClient.js', () => ({
  isOdooApiV2Configured: () => false,
}))

vi.mock('../../adapters/odoo/odooCustomerAdapter.js', () => ({
  createOdooCustomerAdapter: () => ({
    findOrCreateCustomer: vi.fn(),
    updateCustomerBusiness: vi.fn(),
  }),
}))

vi.mock('../../adapters/odoo/odooPortalUserAdapter.js', () => ({
  ensureOdooPortalUser: vi.fn(),
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
    user: { update: prismaUserUpdate },
    odooCustomerMap: { upsert: prismaOdooMapUpsert },
  },
}))

vi.mock('../tax/tax-validation.service.js', () => ({
  taxValidationService: { validate: validateTax },
}))

vi.mock('../auth/auth.repository.js', () => ({
  authRepository: {
    findUserByEmail,
    createUser,
  },
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

describe('professionalAccountService.submit - mail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    findUserByEmail.mockResolvedValue(null)
    createUser.mockResolvedValue({ id: 'user-new' })
    prismaUserUpdate.mockResolvedValue({})
  })

  it('invia sempre conferma al richiedente e notifica admin', async () => {
    findUserByEmail.mockResolvedValue({ id: 'user-existing', passwordHash: 'hash' })

    await professionalAccountService.submit(mockReq(), baseInput)

    expect(sendPwaMail).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'corr-pro-1' }),
      expect.objectContaining({
        templateKey: 'professional_request_admin',
        emailTo: 'info@ideadiluce.com',
      }),
    )
    expect(sendPwaMail).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'corr-pro-1' }),
      expect.objectContaining({
        templateKey: 'professional_request_customer',
        emailTo: 'mario@acme.it',
        vars: expect.objectContaining({ first_name_suffix: ' Mario' }),
      }),
    )
    expect(sendPwaMail).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ templateKey: 'account_credentials' }),
    )
    expect(sendPwaMail).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ templateKey: 'professional_account_customer' }),
    )
  })

  it('con account nuovo invia anche le credenziali', async () => {
    await professionalAccountService.submit(mockReq(), baseInput)

    expect(sendPwaMail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        templateKey: 'professional_request_customer',
        emailTo: 'mario@acme.it',
      }),
    )
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

  it('non fallisce la submit se la mail di conferma fallisce', async () => {
    findUserByEmail.mockResolvedValue({ id: 'user-existing', passwordHash: 'hash' })
    sendPwaMail.mockImplementation(async (_ctx, input) => {
      if (input.templateKey === 'professional_request_customer') {
        throw new Error('smtp down')
      }
    })

    const result = await professionalAccountService.submit(mockReq(), baseInput)
    expect(result).toMatchObject({ submitted: true, id: 'req-1' })
  })
})
