import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    vatValidationCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    taxValidationLog: {
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    integrationLog: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '../../lib/prisma.js'
import { taxValidationService } from './tax-validation.service.js'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('taxValidationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.vatValidationCache.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.vatValidationCache.upsert).mockResolvedValue({} as never)
    vi.mocked(prisma.taxValidationLog.create).mockResolvedValue({} as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)
  })

  it('validates a valid fiscal code', async () => {
    const result = await taxValidationService.validate({
      countryCode: 'IT',
      fiscalCode: 'RSSMRA85M01H501Q',
      personType: 'private',
    })

    expect(result.fiscalCode?.valid).toBe(true)
    expect(result.taxValidationStatus).toBe('valid')
  })

  it('rejects invalid fiscal code', async () => {
    const result = await taxValidationService.validate({
      countryCode: 'IT',
      fiscalCode: 'INVALID',
      personType: 'private',
    })

    expect(result.fiscalCode?.valid).toBe(false)
    expect(result.taxValidationStatus).toBe('invalid')
  })

  it('validates Italian VAT checksum locally and calls VIES', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        valid: true,
        name: 'Azienda Test Srl',
        address: 'Via Roma 1\n20100 Milano',
        requestDate: '2026-06-26',
      }),
    })

    const result = await taxValidationService.validate({
      countryCode: 'IT',
      vatNumber: '01234567897',
      personType: 'company',
    })

    expect(mockFetch).toHaveBeenCalled()
    expect(result.vat?.formatValid).toBe(true)
    expect(result.vat?.checksumValid).toBe(true)
    expect(result.vat?.vies.checked).toBe(true)
    expect(result.vat?.autofill.companyName).toBe('Azienda Test Srl')
    expect(result.vat?.autofill.billingCity).toBe('Milano')
  })

  it('rejects Italian VAT with wrong check digit', async () => {
    const result = await taxValidationService.validate({
      countryCode: 'IT',
      vatNumber: '01234567891',
      personType: 'company',
    })

    expect(result.vat?.checksumValid).toBe(false)
    expect(result.taxValidationStatus).toBe('invalid')
  })

  it('calls VIES for EU company VAT and returns valid', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        valid: true,
        name: 'Test GmbH',
        address: 'Berlin',
        requestDate: '2026-06-26',
      }),
    })

    const result = await taxValidationService.validate({
      countryCode: 'DE',
      vatNumber: 'DE123456789',
      personType: 'company',
    })

    expect(mockFetch).toHaveBeenCalled()
    expect(result.vat?.vies.checked).toBe(true)
    expect(result.vat?.vies.status).toBe('valid')
    expect(result.vat?.vies.name).toBe('Test GmbH')
    expect(result.taxValidationStatus).toBe('valid')
  })

  it('returns service_unavailable when VIES is down', async () => {
    mockFetch.mockRejectedValue(new Error('network error'))

    const result = await taxValidationService.validate({
      countryCode: 'DE',
      vatNumber: 'DE123456789',
      personType: 'company',
    })

    expect(result.vat?.vies.status).toBe('service_unavailable')
    expect(result.taxValidationStatus).toBe('vies_unavailable')
  })

  it('uses cache and avoids second VIES call', async () => {
    vi.mocked(prisma.vatValidationCache.findUnique).mockResolvedValue({
      id: 'c1',
      countryCode: 'DE',
      vatNumber: '123456789',
      valid: true,
      name: 'Cached Co',
      address: 'Munich',
      requestDate: '2026-06-25',
      checkedAt: new Date(),
      expiresAt: new Date(Date.now() + 86_400_000),
    })

    const result = await taxValidationService.validate({
      countryCode: 'DE',
      vatNumber: 'DE123456789',
      personType: 'company',
    })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.vat?.vies.status).toBe('valid')
    expect(result.vat?.vies.name).toBe('Cached Co')
  })
})
